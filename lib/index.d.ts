import { type Locale } from './i18n.js';
import type { Context } from '@deepseek-ai/cordis';
import { type Outcome } from './runtime.js';
declare module '@deepseek-ai/dsh-llm' {
    interface MessageSourceMap {
        'michengai-code-review': {
            readonly kind: 'michengai-code-review';
        };
    }
}
export declare const name = "michengai-code-review";
export declare const inject: string[];
export declare function renderOutcome(result: Outcome, locale?: Locale): string;
export interface Config {
    reportDirectory?: string;
    reviewModel?: string;
}
/** 命令秒级返回并在后台委派原生子 Agent 执行审查，完成后把报告作为会话消息交付。 */
export declare function apply(ctx: Context, config?: Config): void;
