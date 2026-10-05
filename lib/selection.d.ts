import { type Locale } from './i18n.js';
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type Target } from './request.js';
/** 复用宿主的问题服务；选择过程属于主 Agent，审查子 Agent 不向用户提问。 */
export declare function selectTarget(ctx: Context, agent: Agent, input: string, signal: AbortSignal, locale?: Locale): Promise<Target>;
