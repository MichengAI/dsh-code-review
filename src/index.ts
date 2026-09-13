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
const labels: Record<Outcome['status'], string> = { 'no-changes': '无变更', 'completed-clean': '完成 · 零发现', 'completed-findings': '完成 · 有发现', 'completed-text': '完成', partial: '部分覆盖', failed: '失败', interrupted: '中断', 'invalid-output': '输出无效', stale: '快照过期' };
export function renderOutcome(result: Outcome): string {
  return [`代码审查 · ${labels[result.status]}`, `运行：${result.id}`, result.detail,
    result.fingerprint ? `快照：${result.fingerprint}\n基线：${result.base}\n目标：${result.target}` : '', result.report ? renderReport(result.report) : ''].filter(Boolean).join('\n\n');
}

export interface Config { reportDirectory?: string; reviewModel?: string }
/** 命令交给当前 Agent，审查工具委派原生子 Agent，报告作为工具结果回到当前会话。 */
export function apply(ctx: Context, config: Config = {}): void {
  if (config.reportDirectory !== undefined && !isAbsolute(config.reportDirectory)) throw new Error('reportDirectory 必须为绝对路径。');
  if (config.reviewModel !== undefined && !config.reviewModel.trim()) throw new Error('reviewModel 不能为空。');
  const journal = new Journal(config.reportDirectory ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'code-review'));
  const lifetime = new AbortController();
  const active = new Map<string, AbortController>();
  const operations = new Set<Promise<string>>();
  ctx.effect(() => async () => { lifetime.abort(); await Promise.allSettled([...operations]); });
  ctx.commands.register({ name: 'review-cancel', description: '取消当前代码审查', handler({ agent }) {
    active.get(agent.id)?.abort();
    return { kind: 'success', text: active.has(agent.id) ? '已请求取消，等待审查清理完成。' : '没有正在运行的审查。' };
  } });
  ctx.commands.register({ name: 'review-status', description: '查看最近代码审查报告', async handler({ agent }) {
    try {
      const record = await journal.read(agent.id);
      return { kind: 'success', text: active.has(agent.id) ? '审查或范围选择进行中。' : record?.state === 'running' ? '审查中断：存在启动记录但没有完成报告，请重新运行。' : record?.state === 'finished' ? renderOutcome(record.result) : '没有已保存的审查结果。' };
    } catch (error) { return { kind: 'error', text: `审查记录读取失败：${String(error)}` }; }
  } });
  ctx.commands.register({ name: 'review', description: '代码审查：选择范围或输入自定义要求', input: { hint: '留空提交以选择范围；或输入完整的自定义审查要求' },
    async handler(invocation) {
      const { agent, rawInput } = invocation;
      agent.followup(createUserMessage({
        content: [{ type: 'text', text: `请执行代码审查。调用 code_review 工具（空 input 时先由原生问题界面选择范围），input 参数必须为 ${JSON.stringify(rawInput.trim())}。该工具会通过 DSH 原生 spawn 启动独立审查专家。不要自行修改代码或改用其他审查工具；完成后原样呈现工具返回的审查报告，不改写、不新增或删减发现，失败时如实报告原因。` }],
        source: { kind: 'plugin', plugin: '@michengai/dsh-code-review' },
      }));
      return { kind: 'success', text: '已将审查请求提交到当前会话，将通过原生子 Agent 执行。' };
    } });

  async function review(agent: Agent, input: string, signal: AbortSignal): Promise<string> {
    if (active.has(agent.id)) throw new Error('当前会话已有审查运行，请等待或 /review-cancel。');
    const controller = new AbortController();
    active.set(agent.id, controller);
    try {
      const combined = AbortSignal.any([controller.signal, lifetime.signal, signal]);
      const target = await selectTarget(ctx, agent, input, combined);
      combined.throwIfAborted();
      try {
        await journal.write(agent.id, { version: 1, state: 'running', commandId: 'code_review' });
        await ctx.sessions.flush(agent.session);
      } catch (error) { throw new Error(`审查启动记录持久化失败：${String(error)}；未调用子模型。`); }
      const result = await runReview(ctx, agent, target, combined, undefined, config.reviewModel);
      let durable;
      try {
        await journal.write(agent.id, { version: 1, state: 'finished', result });
        durable = await ctx.sessions.flush(agent.session);
      } catch (error) { throw new Error(`${renderOutcome(result)}\n\n报告持久化失败：${String(error)}；不能确认重启后可恢复。`); }
      const text = renderOutcome(result) + (durable ? '' : '\n\n宿主未配置会话持久化后端；结构化报告已独立保存。');
      if (['failed', 'interrupted', 'invalid-output', 'stale'].includes(result.status)) throw new Error(text);
      return text;
    } finally { active.delete(agent.id); }
  }

  ctx.tools.register({
    name: 'code_review', description: '使用完整 Codex 规范，通过 DSH 原生 spawn 子 Agent 自行检查 Git 状态、差异与相关代码并返回报告。input 为空时通过原生问题选择范围；非空时整段作为自定义要求，不解析 CLI 选项。',
    parameters: { type: 'object', properties: { input: { type: 'string', description: '空字符串打开范围选择；非空字符串是完整自定义审查要求，保留原文。' } }, required: ['input'], additionalProperties: false },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
    execute(args, exec) {
      if (!exec.agent) throw new Error('代码审查必须从当前会话调用。');
      const input = (args as { input: unknown }).input;
      if (typeof input !== 'string') throw new Error('input 必须是字符串。');
      const operation = review(exec.agent, input, exec.signal);
      operations.add(operation);
      void operation.then(() => operations.delete(operation), () => operations.delete(operation));
      return operation;
    },
  });
}
