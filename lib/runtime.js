import { readHostLocale, outputLanguage, translate } from './i18n.js';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { setApprovalPolicy } from '@deepseek-ai/dsh-user-approval';
import { reviewPrompt } from './request.js';
import { parseReport, REVIEW_PROMPT } from './report.js';
const creationScope = new AsyncLocalStorage();
/** 审查规范、输出语言，以及把子会话审批转到父会话。宿主把子代理钉成 never，审批框又只挂在发出请求的会话上。 */
export function configureReviewer(agent, parent, locale = readHostLocale(agent.ctx)) {
    agent.ctx.systemPrompt.context({ name: 'michengai:review-language', order: 100, text: outputLanguage(locale) });
    agent.ctx.systemPrompt.section({ name: 'michengai:review', order: 0, complete: true, text: REVIEW_PROMPT });
    setApprovalPolicy(agent.session, 'ask');
    // 先于宿主转发执行，且不调用 next：否则审批会挂在子会话上，父会话看不到，审查会一直等。
    agent.ctx.on('approval/request', (request, next) => {
        if (request.agent !== agent)
            return next();
        return parent.ctx.approval.request({ ...request, agent: parent }).catch(() => 'unavailable');
    }, { prepend: true });
}
/** 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。 */
export async function runReview(ctx, parent, target, signal, timeoutMs, reviewModel, locale = readHostLocale(ctx)) {
    const t = (key) => translate(locale, key);
    const id = randomUUID();
    const combined = timeoutMs === undefined ? signal : AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
    let run;
    let outcome = { id, status: 'failed', detail: t('审查未完成。') };
    try {
        const cwd = parent.session.header.cwd;
        if (!cwd)
            throw new Error(t('会话没有有效 cwd。'));
        const prompt = await reviewPrompt(target, cwd, combined);
        const provider = ctx.subagents.getProvider('spawn');
        if (!provider || provider.inheritsParentContext || !provider.capabilities.persona)
            throw new Error(t('需要独立上下文的原生 spawn provider。'));
        const scope = {};
        let configured = false;
        const stopSetup = ctx.on('agent/created', ({ agent }) => {
            if (creationScope.getStore() !== scope || agent.session.header.parentSession !== parent.id)
                return undefined;
            configureReviewer(agent, parent, locale);
            configured = true;
            return undefined;
        });
        try {
            run = await creationScope.run(scope, () => ctx.subagents.start('spawn', {
                parent, label: t('代码审查'), signal: combined, persona: REVIEW_PROMPT,
                ...(reviewModel ? { agentOptions: { model: reviewModel } } : {}),
                ...(provider.capabilities.toolFilter ? { toolFilter: { deny: ['code_review'] } } : {}),
                prompt: [{ type: 'text', text: prompt }],
            }));
        }
        finally {
            stopSetup();
        }
        if (!configured || !run.localAgent)
            throw new Error(t('原生审查 Agent 未完成配置。'));
        const result = await run.result;
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
        outcome = { ...outcome, status: combined.aborted ? 'interrupted' : 'failed', detail: error instanceof Error ? error.message : String(error) };
    }
    finally {
        if (run) {
            try {
                await run.dispose();
            }
            catch (error) {
                outcome = { ...outcome, status: 'failed', detail: `${t('Agent 清理失败：')}${String(error)}` };
            }
        }
    }
    return outcome;
}
