import { type Locale } from './i18n.js';
import type { Context } from '@deepseek-ai/cordis';
declare module '@deepseek-ai/dsh-llm' {
    interface MessageSourceMap {
        'michengai-code-review': {
            readonly kind: 'michengai-code-review';
        };
    }
}
import { type Outcome } from './runtime.js';
export declare const name = "michengai-code-review";
export declare const inject: string[];
export declare function renderOutcome(result: Outcome, locale?: Locale): string;
export interface Config {
    reportDirectory?: string;
    reviewModel?: string;
}
/** 命令交给当前 Agent，审查工具委派原生子 Agent，报告作为工具结果回到当前会话。 */
export declare function apply(ctx: Context, config?: Config): void;
