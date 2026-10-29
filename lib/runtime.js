import { readHostLocale, outputLanguage, translate } from './i18n.js';
import { randomUUID } from 'node:crypto';
import { SessionId } from '@deepseek-ai/dsh-session';
import { PERSONA_PREFIX_SECTION } from '@deepseek-ai/dsh-system-prompt';
import { reviewPrompt } from './request.js';
import { parseReport, REVIEW_PROMPT } from './report.js';
// 与 Agency 专家一致：角色由 provider 组合，禁止递归召唤专家，权限由宿主委派。
const delegatedTools = ['dsh_code_review', 'summon_expert', 'summon_experts', 'list_experts', 'list_expert_teams', 'get_expert_team', 'summon_expert_team'];
function formatAbortReason(reason, locale = 'zh') {
    const t = (key) => translate(locale, key);
    if (reason instanceof Error) {
        if (reason.name === 'AbortError' || reason.message === 'This operation was aborted')
            return t('操作已中止。');
        if (reason.name === 'TimeoutError' || /timed?\s*out/i.test(reason.message))
            return t('操作超时。');
        return reason.message;
    }
    if (typeof reason === 'string' && reason.trim()) {
        if (reason === 'This operation was aborted')
            return t('操作已中止。');
        return reason.trim();
    }
    if (typeof reason === 'object' && reason !== null) {
        const obj = reason;
        if (typeof obj.message === 'string' && obj.message.trim())
            return obj.message.trim();
        if (typeof obj.kind === 'string') {
            if (obj.kind === 'user')
                return t('用户已取消操作。');
            if (obj.kind === 'parent')
                return t('父级任务已取消。');
            if (obj.kind === 'disposed')
                return t('会话已销毁。');
            if (obj.kind === 'hook') {
                const detail = typeof obj.reason === 'string' && obj.reason.trim() ? (locale === 'en' ? `: ${obj.reason.trim()}` : `：${obj.reason.trim()}`) : '';
                return `${t('操作已中止')}${detail}${detail ? '' : t('。')}`;
            }
            return `${t('操作已中止。')} (${obj.kind})`;
        }
    }
    return t('操作已中止。');
}
function abortError(signal, locale = 'zh') {
    const reason = signal.reason;
    if (reason instanceof Error) {
        if (reason.name === 'AbortError' || reason.message === 'This operation was aborted') {
            return Object.assign(new Error(formatAbortReason(reason, locale)), { name: 'AbortError' });
        }
        return reason;
    }
    return Object.assign(new Error(formatAbortReason(reason, locale)), { name: 'AbortError' });
}
/** 等待 activation 结果；调用方 abort 时立即失败并 fire-and-forget dispose，避免与未协作的 LLM stream 死锁。 */
function awaitActivationResult(activation, signal, locale = 'zh') {
    if (signal.aborted) {
        void activation.dispose();
        return Promise.reject(abortError(signal, locale));
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            void activation.dispose();
            reject(abortError(signal, locale));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        activation.result.then((result) => { signal.removeEventListener('abort', onAbort); resolve(result); }, (error) => { signal.removeEventListener('abort', onAbort); reject(error); });
    });
}
/**
 * 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。
 * 有 `startActivation` 时走 0.2.1-rc.1：角色与工具过滤在子 Agent `agent/created` 时恢复。
 * 0.2.0-rc 等没有该方法时回退到 `start` 加启动期 `persona` / `toolFilter`。
 */
export async function runReview(ctx, parent, target, signal, timeoutMs, reviewModel, locale = readHostLocale(ctx)) {
    const t = (key) => translate(locale, key);
    const id = randomUUID();
    const combined = timeoutMs === undefined ? signal : AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
    let activation;
    let legacyRun;
    let outcome = { id, status: 'failed', detail: t('审查未完成。') };
    let abortedEarly = false;
    try {
        const cwd = parent.session.header.cwd;
        if (!cwd)
            throw new Error(t('会话没有有效 cwd。'));
        const prompt = await reviewPrompt(target, cwd, combined);
        const provider = ctx.subagents.getProvider('spawn');
        if (!provider || provider.inheritsParentContext)
            throw new Error(t('需要独立上下文的原生 spawn provider。'));
        const persona = `${REVIEW_PROMPT}\n\n${outputLanguage(locale)}`;
        const deny = delegatedTools.filter(name => ctx.tools.get(name, parent) !== undefined);
        const subagents = ctx.subagents;
        let result;
        if (typeof subagents.startActivation === 'function') {
            const childId = SessionId(randomUUID());
            const stop = ctx.on('agent/created', ({ agent }) => {
                if (agent.id !== childId)
                    return undefined;
                agent.ctx.systemPrompt.section({
                    name: PERSONA_PREFIX_SECTION,
                    order: agent.ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX'),
                    text: persona,
                });
                if (deny.length)
                    agent.ctx.tools.restrict({ deny });
                return undefined;
            });
            try {
                activation = await subagents.startActivation({
                    provider: 'spawn',
                    label: t('代码审查'),
                    childId,
                    request: {
                        parent,
                        prompt: [{ type: 'text', text: prompt }],
                        ...(reviewModel ? { agentOptions: { model: reviewModel } } : {}),
                    },
                    signal: combined,
                    delivery: 'caller',
                });
            }
            finally {
                stop();
            }
            result = await awaitActivationResult(activation, combined, locale);
        }
        else {
            const capabilities = provider.capabilities;
            if (!capabilities.persona || !capabilities.toolFilter || typeof subagents.start !== 'function')
                throw new Error(t('需要独立上下文的原生 spawn provider。'));
            legacyRun = await subagents.start('spawn', {
                parent, label: t('代码审查'), signal: combined, persona,
                ...(reviewModel ? { agentOptions: { model: reviewModel } } : {}),
                toolFilter: { deny },
                prompt: [{ type: 'text', text: prompt }],
            });
            result = await legacyRun.result;
        }
        combined.throwIfAborted();
        if (result.stopReason !== 'completed')
            throw new Error(`${t('原生子 Agent 未完成：')}${result.stopReason}${result.diagnostic ? ` ${result.diagnostic}` : ''}`);
        const raw = result.output.filter(b => b.type === 'text').map(b => b.text).join('');
        if (!raw.trim())
            throw new Error(t('审查 Agent 未返回报告。'));
        const report = parseReport(raw);
        outcome = { id, status: report.format === 'text' ? 'completed-text' : report.findings.length ? 'completed-findings' : 'completed-clean',
            detail: t('审查完成。'), report };
    }
    catch (error) {
        abortedEarly = combined.aborted;
        let detail = combined.aborted
            ? formatAbortReason(combined.reason, locale)
            : (error instanceof Error ? error.message : formatAbortReason(error, locale));
        const isDomAbort = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError' || (typeof DOMException !== 'undefined' && error instanceof DOMException));
        if (combined.aborted && error instanceof Error && !isDomAbort && error.message && error.message !== detail) {
            detail = `${detail} (${error.message})`;
        }
        outcome = { ...outcome, status: combined.aborted ? 'interrupted' : 'failed', detail };
    }
    finally {
        const handle = activation ?? legacyRun;
        if (handle) {
            try {
                if (activation && abortedEarly) {
                    // 中断时 dispose 可能等 LLM；限时等待以便夹具看到无残留，超时则放行。
                    await Promise.race([
                        handle.dispose(),
                        new Promise(resolve => setTimeout(resolve, 2000)),
                    ]);
                }
                else {
                    await handle.dispose();
                }
            }
            catch (error) {
                if (!activation || !abortedEarly)
                    outcome = { ...outcome, status: 'failed', detail: `${t('Agent 清理失败：')}${String(error)}` };
            }
        }
    }
    return outcome;
}
