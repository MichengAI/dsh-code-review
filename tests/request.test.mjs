import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { reviewPrompt, parseTarget } from '../lib/request.js';

export function git(root, ...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }); }
export async function repository(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, 'init', '-b', 'main'); git(root, 'config', 'user.email', 'test@example.invalid'); git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'core.autocrlf', 'false');
  await writeFile(join(root, 'a.ts'), 'export const value = 1;\n', 'utf8');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'initial');
  return root;
}

test('未提交任务保持 Codex 原文且不要求预读取 Git 仓库', async () => {
  assert.equal(await reviewPrompt({ mode: 'worktree' }, 'does-not-exist'), 'Review the current code changes (staged, unstaged, and untracked files) and provide prioritized findings.');
});

test('自定义要求原文传递，不猜路径、CLI 选项或工作区范围', async () => {
  for (const text of ['--base main', '.', 'help', '审查上一提交\n检查 "权限"']) {
    const target = parseTarget(text);
    assert.deepEqual(target, { mode: 'custom', instructions: text });
    assert.equal(await reviewPrompt(target, 'does-not-exist'), text);
  }
  assert.throws(() => parseTarget('  '));
  await assert.rejects(reviewPrompt({ mode: 'custom', instructions: '' }, '.'));
});

test('提交任务与上游两种标题模板逐字一致，不在宿主读取提交内容', async () => {
  assert.equal(await reviewPrompt({ mode: 'commit', ref: 'HEAD' }, '.'), 'Review the code changes introduced by commit HEAD. Provide prioritized, actionable findings.');
  assert.equal(await reviewPrompt({ mode: 'commit', ref: 'abc123', title: 'Fix auth' }, '.'), 'Review the code changes introduced by commit abc123 ("Fix auth"). Provide prioritized, actionable findings.');
});

test('分支只计算共同祖先，diff 留给 Agent；不存在分支走上游回退', async t => {
  const root = await repository(t);
  const base = git(root, 'rev-parse', 'HEAD').trim();
  await writeFile(join(root, 'a.ts'), 'SECRET_CONTENT_NOT_IN_PROMPT');
  const prompt = await reviewPrompt({ mode: 'base', ref: 'main' }, root);
  assert.equal(prompt, `Review the code changes against the base branch 'main'. The merge base commit for this comparison is ${base}. Run \`git diff ${base}\` to inspect the changes relative to main. Provide prioritized, actionable findings.`);
  assert.doesNotMatch(prompt, /SECRET_CONTENT/);
  assert.match(await reviewPrompt({ mode: 'base', ref: 'missing' }, root), /Start by finding the merge diff/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(reviewPrompt({ mode: 'base', ref: 'main' }, root, controller.signal));
});

test('基准 upstream 领先时使用上游共同祖先，与 Codex 一致', async t => {
  const root = await repository(t);
  git(root, 'checkout', '-qb', 'upstream');
  await writeFile(join(root, 'a.ts'), 'upstream\n'); git(root, 'add', '.'); git(root, 'commit', '-qm', 'upstream');
  const expected = git(root, 'rev-parse', 'HEAD').trim();
  git(root, 'branch', '--set-upstream-to=upstream', 'main');
  git(root, 'checkout', '-qb', 'feature');
  await writeFile(join(root, 'b.ts'), 'feature\n'); git(root, 'add', '.'); git(root, 'commit', '-qm', 'feature');
  assert.ok((await reviewPrompt({ mode: 'base', ref: 'main' }, root)).includes(`merge base commit for this comparison is ${expected}.`));
});
