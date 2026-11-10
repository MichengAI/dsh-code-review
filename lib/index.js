import { readHostLocale, translate, outputLanguage } from './i18n.js';
import { HarnessError, createUserMessage } from '@deepseek-ai/dsh-llm';
import { selectTarget } from './selection.js';
import { runReview } from './runtime.js';
import { renderReport } from './report.js';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Journal } from './journal.js';
/** V4 拒绝共享的 `plugin` 来源；用户消息使用插件自己的 kind。 */
const reviewRequestSource = { kind: 'michengai-code-review' };
export const name = 'michengai-code-review';
export const inject = ['commands', 'subagents', 'agents', 'tools', 'systemPrompt', 'sessions', 'userQuestions'];
const labels = { 'no-changes': '无变更', 'completed-clean': '完成 · 零发现', 'completed-findings': '完成 · 有发现', 'completed-text': '完成', partial: '部分覆盖', failed: '失败', interrupted: '中断', 'invalid-output': '输出无效', stale: '快照过期' };
export function renderOutcome(result, locale = 'zh') {
    const t = (key) => translate(locale, key);
    return [`## ${t('代码审查')} · ${translate(locale, labels[result.status])}`, `${t('运行：')}\`${result.id}\``, result.detail,
        result.fingerprint ? `${t('快照：')}${result.fingerprint}\n${t('基线：')}${result.base}\n${t('目标：')}${result.target}` : '', result.report ? renderReport(result.report, locale) : ''].filter(Boolean).join('\n\n');
}
/** 命令交给当前 Agent，审查工具委派原生子 Agent，报告作为工具结果回到当前会话。 */
export function apply(ctx, config = {}) {
    const t = (key) => translate(readHostLocale(ctx), key);
    if (config.reportDirectory !== undefined && !isAbsolute(config.reportDirectory))
        throw new Error(t('reportDirectory 必须为绝对路径。'));
    if (config.reviewModel !== undefined && !config.reviewModel.trim())
        throw new Error(t('reviewModel 不能为空。'));
    const journal = new Journal(config.reportDirectory ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'code-review'));
    const lifetime = new AbortController();
    const active = new Map();
    const operations = new Set();
    ctx.effect(() => async () => { lifetime.abort(); await Promise.allSettled([...operations]); });
    ctx.commands.register({ name: 'review-cancel', description: t('取消当前代码审查'), handler({ agent }) {
            active.get(agent.id)?.abort();
            return { kind: 'success', text: active.has(agent.id) ? t('已请求取消，等待审查清理完成。') : t('没有正在运行的审查。') };
        } });
    ctx.commands.register({ name: 'review-status', description: t('查看最近代码审查报告'), async handler({ agent }) {
            try {
                const record = await journal.read(agent.id, readHostLocale(ctx));
                return { kind: 'success', text: active.has(agent.id) ? t('审查或范围选择进行中。') : record?.state === 'running' ? t('审查中断：存在启动记录但没有完成报告，请重新运行。') : record?.state === 'finished' ? renderOutcome(record.result, readHostLocale(ctx)) : t('没有已保存的审查结果。') };
            }
            catch (error) {
                return { kind: 'error', text: `${t('审查记录读取失败：')}${String(error)}` };
            }
        } });
    function deliverReport(agent, text, locale) {
        if (lifetime.signal.aborted)
            return;
        try {
            agent.followup(createUserMessage({
                content: [{ type: 'text', text: `Here is the completed code review report:\n\n${text}\n\nPresent this report directly to the user verbatim without adding, removing, or rewriting findings. Do not attempt to fix code or perform another review. ${outputLanguage(locale)}` }],
                source: reviewRequestSource,
            }));
        }
        catch { /* session disposed or unavailable */ }
    }
    function deliverError(agent, error, locale) {
        const text = error instanceof HarnessError ? error.message : `${translate(locale, '审查未完成。')}\n\n${error instanceof Error ? error.message : String(error)}`;
        try {
            agent.followup(createUserMessage({
                content: [{ type: 'text', text: `The code review did not complete:\n\n${text}\n\nPresent this status directly to the user verbatim without retrying. ${outputLanguage(locale)}` }],
                source: reviewRequestSource,
            }));
        }
        catch { /* session disposed or unavailable */ }
    }
    ctx.commands.register({ name: 'review', description: t('选择范围或输入自定义要求'), input: { hint: t('留空提交以选择范围；或输入完整的自定义审查要求') },
        async handler(invocation) {
            const { agent, rawInput, signal } = invocation;
            const locale = readHostLocale(ctx);
            if (active.has(agent.id)) {
                return { kind: 'error', text: translate(locale, '当前会话已有审查运行，请等待或 /review-cancel。') };
            }
            const operation = review(agent, rawInput.trim(), signal);
            operations.add(operation);
            void operation
                .then(text => { deliverReport(agent, text, locale); }, error => { deliverError(agent, error, locale); })
                .finally(() => operations.delete(operation));
            return { kind: 'success', text: translate(locale, '已将审查请求提交到当前会话，将通过原生子 Agent 执行。') };
        } });
    async function review(agent, input, signal) {
        const locale = readHostLocale(ctx);
        const t = (key) => translate(locale, key);
        if (active.has(agent.id))
            throw new Error(t('当前会话已有审查运行，请等待或 /review-cancel。'));
        const controller = new AbortController();
        active.set(agent.id, controller);
        let started = false;
        try {
            const combined = AbortSignal.any([controller.signal, lifetime.signal, signal]);
            const target = await selectTarget(ctx, agent, input, combined, locale);
            combined.throwIfAborted();
            try {
                await journal.write(agent.id, { version: 1, state: 'running', commandId: 'review' }, locale);
                started = true;
                await ctx.sessions.flush(agent.session);
            }
            catch (error) {
                throw new Error(`${t('审查启动记录持久化失败：')}${String(error)}${t('；未调用子模型。')}`);
            }
            const result = await runReview(ctx, agent, target, combined, undefined, config.reviewModel, locale);
            let durable;
            try {
                await journal.write(agent.id, { version: 1, state: 'finished', result }, locale);
                durable = await ctx.sessions.flush(agent.session);
            }
            catch (error) {
                throw new Error(`${renderOutcome(result, locale)}\n\n${t('报告持久化失败：')}${String(error)}${t('；不能确认重启后可恢复。')}`);
            }
            const text = renderOutcome(result, locale) + (durable ? '' : '\n\n' + t('宿主未配置会话持久化后端；结构化报告已独立保存。'));
            if (['failed', 'interrupted', 'invalid-output', 'stale'].includes(result.status)) {
                const code = result.status === 'interrupted' ? 'REVIEW_INTERRUPTED' : 'REVIEW_FAILED';
                throw new HarnessError(text, code);
            }
            return text;
        }
        catch (error) {
            if (started && !(error instanceof HarnessError) && error instanceof Error && (error.name === 'AbortError' || error.message === 'This operation was aborted')) {
                try {
                    const detail = error.message && error.message !== 'This operation was aborted' ? error.message : t('操作已中止。');
                    await journal.write(agent.id, { version: 1, state: 'finished', result: { id: randomUUID(), status: 'interrupted', detail } }, locale);
                }
                catch { /* ignore */ }
            }
            throw error;
        }
        finally {
            active.delete(agent.id);
            ctx.emit('michengai-code-review/settled', { agent });
        }
    }
}
