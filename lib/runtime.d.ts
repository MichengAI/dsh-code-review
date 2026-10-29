import { type Locale } from './i18n.js';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type Target } from './request.js';
import { type Report } from './report.js';
export type Status = 'no-changes' | 'completed-clean' | 'completed-findings' | 'completed-text' | 'partial' | 'failed' | 'interrupted' | 'invalid-output' | 'stale';
export interface Outcome {
    id: string;
    status: Status;
    detail: string;
    fingerprint?: string;
    base?: string;
    target?: string;
    report?: Report;
    raw?: string;
}
/**
 * 原生 spawn 独立历史；只发送短任务，Git 和代码检查由子 Agent 自行完成。
 * 有 `startActivation` 时走 0.2.1-rc.1：角色与工具过滤在子 Agent `agent/created` 时恢复。
 * 0.2.0-rc 等没有该方法时回退到 `start` 加启动期 `persona` / `toolFilter`。
 */
export declare function runReview(ctx: Context, parent: Agent, target: Target, signal: AbortSignal, timeoutMs?: number, reviewModel?: string, locale?: Locale): Promise<Outcome>;
