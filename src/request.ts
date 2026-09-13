import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
export type Target = { mode: 'worktree' } | { mode: 'base'; ref: string } | { mode: 'commit'; ref: string; title?: string } | { mode: 'custom'; instructions: string };

/** 仅供菜单列举引用与解析 merge-base；代码和 diff 留给审查 Agent 自行读取。 */
export async function git(cwd: string, args: string[], signal?: AbortSignal): Promise<Buffer> {
  const { stdout } = await exec('git', ['--no-optional-locks', ...args], {
    cwd, signal, encoding: 'buffer', maxBuffer: 1024 * 1024, windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
  });
  return stdout;
}

export function parseTarget(input: string): Target {
  const instructions = input.trim();
  if (!instructions) throw new Error('自定义审查要求不能为空。');
  return { mode: 'custom', instructions };
}

/** 对齐固定版本 codex-rs/prompts/src/review_request.rs 的短任务文本。 */
export async function reviewPrompt(target: Target, cwd: string, signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  switch (target.mode) {
    case 'worktree': return 'Review the current code changes (staged, unstaged, and untracked files) and provide prioritized findings.';
    case 'custom': {
      if (!target.instructions.trim()) throw new Error('自定义审查要求不能为空。');
      return target.instructions.trim();
    }
    case 'commit': return target.title
      ? `Review the code changes introduced by commit ${target.ref} ("${target.title}"). Provide prioritized, actionable findings.`
      : `Review the code changes introduced by commit ${target.ref}. Provide prioritized, actionable findings.`;
    case 'base': {
      await git(cwd, ['rev-parse', '--show-toplevel'], signal);
      const resolveRef = async (ref: string) => {
        try { return (await git(cwd, ['rev-parse', '--verify', '--end-of-options', ref], signal)).toString('utf8').trim(); }
        catch (error) { signal?.throwIfAborted(); if (typeof (error as { code?: unknown }).code === 'number') return undefined; throw error; }
      };
      const head = await resolveRef('HEAD');
      let ref = await resolveRef(target.ref);
      if (head && ref) {
        // 上游有本地基准分支尚未包含的提交时，Codex 优先使用其 upstream。
        const upstream = await resolveRef(`${target.ref}@{upstream}`);
        if (upstream) {
          const counts = (await git(cwd, ['rev-list', '--left-right', '--count', `${ref}...${upstream}`], signal)).toString('utf8').trim().split(/\s+/);
          if (Number(counts[1]) > 0) ref = upstream;
        }
        const base = (await git(cwd, ['merge-base', head, ref], signal)).toString('utf8').trim();
        return `Review the code changes against the base branch '${target.ref}'. The merge base commit for this comparison is ${base}. Run \`git diff ${base}\` to inspect the changes relative to ${target.ref}. Provide prioritized, actionable findings.`;
      }
      return `Review the code changes against the base branch '${target.ref}'. Start by finding the merge diff between the current branch and ${target.ref}'s upstream e.g. (\`git merge-base HEAD "$(git rev-parse --abbrev-ref "${target.ref}@{upstream}")"\`), then run \`git diff\` against that SHA to see what changes we would merge into the ${target.ref} branch. Provide prioritized, actionable findings.`;
    }
  }
}
