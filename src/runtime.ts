import { readHostLocale, translate, outputLanguage, type Locale } from './i18n.js';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SubagentRun } from '@deepseek-ai/dsh-subagent';
import { setApprovalPolicy } from '@deepseek-ai/dsh-user-approval';
import type {} from '@deepseek-ai/dsh-tools';
import type {} from '@deepseek-ai/dsh-system-prompt';
import { reviewPrompt, type Target } from './request.js';
import { parseReport, REVIEW_PROMPT, type Report } from './report.js';

// 旧状态仅为历史报告兼容；新运行不再生成快照、过期或插件自定覆盖判断。
export type Status = 'no-changes' | 'completed-clean' | 'completed-findings' | 'completed-text' | 'partial' | 'failed' | 'interrupted' | 'invalid-output' | 'stale';
export interface Outcome { id: string; status: Status; detail: string; fingerprint?: string; base?: string; target?: string; report?: Report; raw?: string }
const creationScope = new AsyncLocalStorage<object>();
// 对应 Codex 关闭 web/collab/image 功能；其余工具继承 DSH 的部署和权限配置。
const disabledTools = ['code_review', 'subagent', 'subagent_fork', 'spawn_agent', 'spawn_teammate', 'summon_expert', 'summon_experts',
  'send_message', 'interrupt_agent', 'list_agents', 'wait_agent', 'team_task_create', 'team_task_list', 'team_task_get', 'team_task_update',
  'web_search', 'web_fetch', 'view_image', 'read_image'];

/** 仅设置原版审查规范及 never 审批；保留原生工具和运行上下文。 */
export function configureReviewer(agent: Agent, locale: Locale = readHostLocale(agent.ctx)): void {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  agent.ctx.systemPrompt.context({ name: 'michengai:review-language', order: 100, text: outputLanguage(locale) });
  setApprovalPolicy(agent.session, 'never');
  agent.ctx.tools.presentAs('native');
  // get(name, parent) 会包含局部工具；restrict 不接受子 Agent 自己注册的工具。
  // 只过滤全局注册项，局部和后续注册工具由下方 guard 统一限制执行。
  const deny = disabledTools.filter(name => agent.ctx.tools.get(name) !== undefined);
  if (deny.length) agent.ctx.tools.restrict({ deny });
  agent.ctx.tools.guard(exec => disabledTools.includes(exec.name) ? t('审查模式不提供网页、图片或继续委派能力。') : undefined);
  agent.ctx.systemPrompt.section({ name: 'michengai:review', order: 0, complete: true, text: REVIEW_PROMPT });
}

/** 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。 */
export async function runReview(ctx: Context, parent: Agent, target: Target, signal: AbortSignal, timeoutMs?: number, reviewModel?: string, locale: Locale = readHostLocale(ctx)): Promise<Outcome> {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const id = randomUUID();
  const combined = timeoutMs === undefined ? signal : AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  let run: SubagentRun | undefined;
  let outcome: Outcome = { id, status: 'failed', detail: t('审查未完成。') };
  try {
    const cwd = parent.session.header.cwd;
    if (!cwd) throw new Error(t('会话没有有效 cwd。'));
    const prompt = await reviewPrompt(target, cwd, combined);
    const provider = ctx.subagents.getProvider('spawn');
    if (!provider || provider.inheritsParentContext || !provider.capabilities.persona) throw new Error(t('需要独立上下文的原生 spawn provider。'));
    const scope = {};
    let configured = false;
    const stopSetup = ctx.on('agent/created', ({ agent }) => {
      if (creationScope.getStore() !== scope || agent.session.header.parentSession !== parent.id) return undefined;
      configureReviewer(agent, locale);
      configured = true;
      return undefined;
    });
    try {
      run = await creationScope.run(scope, () => ctx.subagents.start('spawn', {
        parent, label: t('代码审查'), signal: combined, persona: REVIEW_PROMPT,
        ...(reviewModel ? { agentOptions: { model: reviewModel } } : {}),
        prompt: [{ type: 'text', text: prompt }],
      }));
    } finally { stopSetup(); }
    if (!configured || !run.localAgent) throw new Error(t('原生审查 Agent 未完成配置。'));
    const result = await run.result;
    combined.throwIfAborted();
    if (result.stopReason !== 'completed') throw new Error(`${t('原生子 Agent 未完成：')}${result.stopReason}${result.diagnostic ? ` ${result.diagnostic}` : ''}`);
    const raw = result.output.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!raw.trim()) throw new Error(t('审查 Agent 未返回报告。'));
    const report = parseReport(raw);
    outcome = { id, status: report.format === 'text' ? 'completed-text' : report.findings.length ? 'completed-findings' : 'completed-clean',
      detail: t('审查完成。'), report };
  } catch (error) {
    outcome = { ...outcome, status: combined.aborted ? 'interrupted' : 'failed', detail: error instanceof Error ? error.message : String(error) };
  } finally {
    if (run) {
      try { await run.dispose(); }
      catch (error) { outcome = { ...outcome, status: 'failed', detail: `${t('Agent 清理失败：')}${String(error)}` }; }
    }
  }
  return outcome;
}
