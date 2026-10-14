import { readHostLocale, outputLanguage, translate, type Locale } from './i18n.js';
import { randomUUID } from 'node:crypto';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { SessionId } from '@deepseek-ai/dsh-session';
import type { SubagentActivation, SubagentResult } from '@deepseek-ai/dsh-subagent';
import { PERSONA_PREFIX_SECTION } from '@deepseek-ai/dsh-system-prompt';
import type {} from '@deepseek-ai/dsh-tools';
import { reviewPrompt, type Target } from './request.js';
import { parseReport, REVIEW_PROMPT, type Report } from './report.js';

// 旧状态仅为历史报告兼容；新运行不再生成快照、过期或插件自定覆盖判断。
export type Status = 'no-changes' | 'completed-clean' | 'completed-findings' | 'completed-text' | 'partial' | 'failed' | 'interrupted' | 'invalid-output' | 'stale';
export interface Outcome { id: string; status: Status; detail: string; fingerprint?: string; base?: string; target?: string; report?: Report; raw?: string }
// 与 Agency 专家一致：角色由 provider 组合，禁止递归召唤专家，权限由宿主委派。
const delegatedTools = ['dsh_code_review', 'summon_expert', 'summon_experts', 'list_experts', 'list_expert_teams', 'get_expert_team', 'summon_expert_team'];

function abortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  if (reason instanceof Error) return reason;
  return Object.assign(new Error(reason === undefined ? 'This operation was aborted' : String(reason)), { name: 'AbortError' });
}

/** 等待 activation 结果；调用方 abort 时立即失败并 fire-and-forget dispose，避免与未协作的 LLM stream 死锁。 */
function awaitActivationResult(activation: SubagentActivation, signal: AbortSignal): Promise<SubagentResult> {
  if (signal.aborted) {
    void activation.dispose();
    return Promise.reject(abortError(signal));
  }
  return new Promise<SubagentResult>((resolve, reject) => {
    const onAbort = () => {
      void activation.dispose();
      reject(abortError(signal));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    activation.result.then(
      (result) => { signal.removeEventListener('abort', onAbort); resolve(result); },
      (error) => { signal.removeEventListener('abort', onAbort); reject(error); },
    );
  });
}

/**
 * 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。
 * DSH 0.2.1-alpha.3 起 `start`/`persona`/`toolFilter` 已移除：改走 `startActivation`，
 * 并在子 Agent `agent/created` 时用 scoped persona 与 tools.restrict 恢复原审查角色与工具过滤。
 */
export async function runReview(ctx: Context, parent: Agent, target: Target, signal: AbortSignal, timeoutMs?: number, reviewModel?: string, locale: Locale = readHostLocale(ctx)): Promise<Outcome> {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const id = randomUUID();
  const combined = timeoutMs === undefined ? signal : AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  let activation: SubagentActivation | undefined;
  let outcome: Outcome = { id, status: 'failed', detail: t('审查未完成。') };
  let abortedEarly = false;
  try {
    const cwd = parent.session.header.cwd;
    if (!cwd) throw new Error(t('会话没有有效 cwd。'));
    const prompt = await reviewPrompt(target, cwd, combined);
    const provider = ctx.subagents.getProvider('spawn');
    if (!provider || provider.inheritsParentContext) throw new Error(t('需要独立上下文的原生 spawn provider。'));
    const childId = SessionId(randomUUID());
    const persona = `${REVIEW_PROMPT}\n\n${outputLanguage(locale)}`;
    const deny = delegatedTools.filter(name => ctx.tools.get(name, parent) !== undefined);
    const stop = ctx.on('agent/created', ({ agent }) => {
      if (agent.id !== childId) return undefined;
      agent.ctx.systemPrompt.section({
        name: PERSONA_PREFIX_SECTION,
        order: agent.ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX'),
        text: persona,
      });
      if (deny.length) agent.ctx.tools.restrict({ deny });
      return undefined;
    });
    try {
      activation = await ctx.subagents.startActivation({
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
    } finally {
      stop();
    }
    const result = await awaitActivationResult(activation, combined);
    combined.throwIfAborted();
    if (result.stopReason !== 'completed') throw new Error(`${t('原生子 Agent 未完成：')}${result.stopReason}${result.diagnostic ? ` ${result.diagnostic}` : ''}`);
    const raw = result.output.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!raw.trim()) throw new Error(t('审查 Agent 未返回报告。'));
    const report = parseReport(raw);
    outcome = { id, status: report.format === 'text' ? 'completed-text' : report.findings.length ? 'completed-findings' : 'completed-clean',
      detail: t('审查完成。'), report };
  } catch (error) {
    abortedEarly = combined.aborted;
    outcome = { ...outcome, status: combined.aborted ? 'interrupted' : 'failed', detail: error instanceof Error ? error.message : String(error) };
  } finally {
    if (activation) {
      try {
        if (abortedEarly) {
          // 中断时 dispose 可能等 LLM；限时等待以便夹具看到无残留，超时则放行。
          await Promise.race([
            activation.dispose(),
            new Promise<void>(resolve => setTimeout(resolve, 2000)),
          ]);
        } else {
          await activation.dispose();
        }
      } catch (error) {
        if (!abortedEarly) outcome = { ...outcome, status: 'failed', detail: `${t('Agent 清理失败：')}${String(error)}` };
      }
    }
  }
  return outcome;
}
