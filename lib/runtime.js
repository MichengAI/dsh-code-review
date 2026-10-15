import { readHostLocale, outputLanguage, translate } from './i18n.js';
import { randomUUID } from 'node:crypto';
import { SessionId } from '@deepseek-ai/dsh-session';
import { reviewPrompt } from './request.js';
import { parseReport, REVIEW_PROMPT } from './report.js';
// 与 Agency 专家一致：角色由 provider 组合，禁止递归召唤专家，权限由宿主委派。
const delegatedTools = ['dsh_code_review', 'summon_expert', 'summon_experts', 'list_experts', 'list_expert_teams', 'get_expert_team', 'summon_expert_team'];
function abortError(signal) {
    const reason = signal.reason;
    if (reason instanceof Error)
        return reason;
    return Object.assign(new Error(reason === undefined ? 'This operation was aborted' : String(reason)), { name: 'AbortError' });
}
/** 等待 activation 结果；调用方 abort 时立即失败并 fire-and-forget dispose，避免与未协作的 LLM stream 死锁。 */
function awaitActivationResult(activation, signal) {
    if (signal.aborted) {
        void activation.dispose();
        return Promise.reject(abortError(signal));
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            void activation.dispose();
            reject(abortError(signal));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        activation.result.then((result) => { signal.removeEventListener('abort', onAbort); resolve(result); }, (error) => { signal.removeEventListener('abort', onAbort); reject(error); });
    });
}
/**
 * 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。
 * 有 `startActivation` 时走 0.2.1-alpha.3：角色与工具过滤在子 Agent `agent/created` 时恢复。
 * 没有该方法时原样回退到 `start` 加启动期 `persona` / `toolFilter`。
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
            // 0.1.2-rc.1 没有这个导出；静态导入会让整个插件在旧宿主上加载失败。
            const { PERSONA_PREFIX_SECTION } = await import('@deepseek-ai/dsh-system-prompt');
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
            result = await awaitActivationResult(activation, combined);
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
        outcome = { ...outcome, status: combined.aborted ? 'interrupted' : 'failed', detail: error instanceof Error ? error.message : String(error) };
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
