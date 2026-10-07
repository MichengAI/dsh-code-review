import { readHostLocale, outputLanguage, translate } from './i18n.js';
import { randomUUID } from 'node:crypto';
import { reviewPrompt } from './request.js';
import { parseReport, REVIEW_PROMPT } from './report.js';
// 与 Agency 专家一致：角色由 provider 组合，禁止递归召唤专家，权限由宿主委派。
const delegatedTools = ['code_review', 'summon_expert', 'summon_experts', 'list_experts', 'list_expert_teams', 'get_expert_team', 'summon_expert_team'];
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
        if (!provider || provider.inheritsParentContext || !provider.capabilities.persona || !provider.capabilities.toolFilter)
            throw new Error(t('需要独立上下文的原生 spawn provider。'));
        run = await ctx.subagents.start('spawn', {
            parent, label: t('代码审查'), signal: combined,
            persona: `${REVIEW_PROMPT}\n\n${outputLanguage(locale)}`,
            ...(reviewModel ? { agentOptions: { model: reviewModel } } : {}),
            toolFilter: { deny: delegatedTools.filter(name => ctx.tools.get(name, parent) !== undefined) },
            prompt: [{ type: 'text', text: prompt }],
        });
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
