export type Target = {
    mode: 'worktree';
} | {
    mode: 'base';
    ref: string;
} | {
    mode: 'commit';
    ref: string;
    title?: string;
} | {
    mode: 'custom';
    instructions: string;
};
/** 仅供菜单列举引用与解析 merge-base；代码和 diff 留给审查 Agent 自行读取。 */
export declare function git(cwd: string, args: string[], signal?: AbortSignal): Promise<Buffer>;
export declare function parseTarget(input: string): Target;
/** 对齐固定版本 codex-rs/prompts/src/review_request.rs 的短任务文本。 */
export declare function reviewPrompt(target: Target, cwd: string, signal?: AbortSignal): Promise<string>;
