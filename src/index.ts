import { readHostLocale, translate, outputLanguage, type Locale } from './i18n.js';
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-commands';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type {} from '@deepseek-ai/dsh-subagent';
import { selectTarget } from './selection.js';
import { runReview, type Outcome } from './runtime.js';
import { renderReport } from './report.js';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { Journal } from './journal.js';
export const name = 'michengai-code-review';
export const inject = ['commands', 'subagents', 'agents', 'tools', 'systemPrompt', 'sessions', 'userQuestions'];
const labels: Record<Outcome['status'], Parameters<typeof translate>[1]> = { 'no-changes': '无变更', 'completed-clean': '完成 · 零发现', 'completed-findings': '完成 · 有发现', 'completed-text': '完成', partial: '部分覆盖', failed: '失败', interrupted: '中断', 'invalid-output': '输出无效', stale: '快照过期' };
export function renderOutcome(result: Outcome, locale: Locale = 'zh'): string {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return [`${t('代码审查')} · ${translate(locale, labels[result.status])}`, `${t('运行：')}${result.id}`, result.detail,
    result.fingerprint ? `${t('快照：')}${result.fingerprint}\n${t('基线：')}${result.base}\n${t('目标：')}${result.target}` : '', result.report ? renderReport(result.report, locale) : ''].filter(Boolean).join('\n\n');
}

export interface Config { reportDirectory?: string; reviewModel?: string }
/** 命令交给当前 Agent，审查工具委派原生子 Agent，报告作为工具结果回到当前会话。 */
export function apply(ctx: Context, config: Config = {}): void {
  const t = (key: Parameters<typeof translate>[1]) => translate(readHostLocale(ctx), key);
  if (config.reportDirectory !== undefined && !isAbsolute(config.reportDirectory)) throw new Error(t('reportDirectory 必须为绝对路径。'));
  if (config.reviewModel !== undefined && !config.reviewModel.trim()) throw new Error(t('reviewModel 不能为空。'));
  const journal = new Journal(config.reportDirectory ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'code-review'));
  const lifetime = new AbortController();
  const active = new Map<string, AbortController>();
  const operations = new Set<Promise<string>>();
  ctx.effect(() => async () => { lifetime.abort(); await Promise.allSettled([...operations]); });
  ctx.commands.register({ name: 'review-cancel', description: t('取消当前代码审查'), handler({ agent }) {
    active.get(agent.id)?.abort();
    return { kind: 'success', text: active.has(agent.id) ? t('已请求取消，等待审查清理完成。') : t('没有正在运行的审查。') };
  } });
  ctx.commands.register({ name: 'review-status', description: t('查看最近代码审查报告'), async handler({ agent }) {
    try {
      const record = await journal.read(agent.id);
      return { kind: 'success', text: active.has(agent.id) ? t('审查或范围选择进行中。') : record?.state === 'running' ? t('审查中断：存在启动记录但没有完成报告，请重新运行。') : record?.state === 'finished' ? renderOutcome(record.result, readHostLocale(ctx)) : t('没有已保存的审查结果。') };
    } catch (error) { return { kind: 'error', text: `${t('审查记录读取失败：')}${String(error)}` }; }
  } });
  ctx.commands.register({ name: 'review', description: t('代码审查：选择范围或输入自定义要求'), input: { hint: t('留空提交以选择范围；或输入完整的自定义审查要求') },
    async handler(invocation) {
      const { agent, rawInput } = invocation;
      agent.followup(createUserMessage({
        content: [{ type: 'text', text: `Perform a code review by calling code_review with input exactly ${JSON.stringify(rawInput.trim())}. Empty input opens native scope selection. The tool uses DSH native spawn with an independent reviewer. Do not modify code or substitute other review tools. Present the returned report verbatim without adding, removing, or rewriting findings. Report failures accurately. ${outputLanguage(readHostLocale(ctx))}` }],
        source: { kind: 'plugin', plugin: '@michengai/dsh-code-review' },
      }));
      return { kind: 'success', text: t('已将审查请求提交到当前会话，将通过原生子 Agent 执行。') };
    } });

  async function review(agent: Agent, input: string, signal: AbortSignal): Promise<string> {
    const locale = readHostLocale(ctx);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    if (active.has(agent.id)) throw new Error(t('当前会话已有审查运行，请等待或 /review-cancel。'));
    const controller = new AbortController();
    active.set(agent.id, controller);
    try {
      const combined = AbortSignal.any([controller.signal, lifetime.signal, signal]);
      const target = await selectTarget(ctx, agent, input, combined, locale);
      combined.throwIfAborted();
      try {
        await journal.write(agent.id, { version: 1, state: 'running', commandId: 'code_review' });
        await ctx.sessions.flush(agent.session);
      } catch (error) { throw new Error(`${t('审查启动记录持久化失败：')}${String(error)}${t('；未调用子模型。')}`); }
      const result = await runReview(ctx, agent, target, combined, undefined, config.reviewModel, locale);
      let durable;
      try {
        await journal.write(agent.id, { version: 1, state: 'finished', result });
        durable = await ctx.sessions.flush(agent.session);
      } catch (error) { throw new Error(`${renderOutcome(result, locale)}\n\n${t('报告持久化失败：')}${String(error)}${t('；不能确认重启后可恢复。')}`); }
      const text = renderOutcome(result, locale) + (durable ? '' : '\n\n' + t('宿主未配置会话持久化后端；结构化报告已独立保存。'));
      if (['failed', 'interrupted', 'invalid-output', 'stale'].includes(result.status)) throw new Error(text);
      return text;
    } finally { active.delete(agent.id); }
  }

  ctx.tools.register({
    name: 'code_review', description: '使用完整 Codex 规范，通过 DSH 原生 spawn 子 Agent 自行检查 Git 状态、差异与相关代码并返回报告。input 为空时通过原生问题选择范围；非空时整段作为自定义要求，不解析 CLI 选项。',
    parameters: { type: 'object', properties: { input: { type: 'string', description: '空字符串打开范围选择；非空字符串是完整自定义审查要求，保留原文。' } }, required: ['input'], additionalProperties: false },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
    execute(args, exec) {
      if (!exec.agent) throw new Error(t('代码审查必须从当前会话调用。'));
      const input = (args as { input: unknown }).input;
      if (typeof input !== 'string') throw new Error(t('input 必须是字符串。'));
      const operation = review(exec.agent, input, exec.signal);
      operations.add(operation);
      void operation.then(() => operations.delete(operation), () => operations.delete(operation));
      return operation;
    },
  });
}
