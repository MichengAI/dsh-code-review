import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Context } from '@deepseek-ai/cordis';
import { AgentRegistry } from '@deepseek-ai/dsh-agent';
import { SubagentRuntime } from '@deepseek-ai/dsh-subagent';
import * as spawn from '@deepseek-ai/dsh-subagent-spawn-in-process';
import { AgentLoop } from '@deepseek-ai/dsh-agent-loop';
import { ApprovalService } from '@deepseek-ai/dsh-user-approval';
import { UserQuestionService } from '@deepseek-ai/dsh-user-questions';
import { CommandRuntime } from '@deepseek-ai/dsh-commands';
import { LlmAdapter, LlmRuntime, createUserMessage } from '@deepseek-ai/dsh-llm';
import { SessionStore } from '@deepseek-ai/dsh-session';
import { SessionProjectionRegistry } from '@deepseek-ai/dsh-session-projection';
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt';
import { ToolRuntime } from '@deepseek-ai/dsh-tools';
import { SettingsProvider } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';
import { validateStoredEvents } from '@deepseek-ai/dsh-session-persistence';
import { createHash } from 'node:crypto';
import * as plugin from '../lib/index.js';
import { runReview } from '../lib/runtime.js';

const empty = JSON.stringify({ findings: [], overall_correctness: 'patch is correct', overall_explanation: '未发现有证据的新增缺陷', overall_confidence_score: 0.8 });
test('宿主语言控制菜单与模型输出指令，切换后下一次生效且原文不变', async t => {
  const s = await setup(t, empty, { locale: 'en', answer: async request => ({ answers: [{ id: request.questions[0].id, selected: [request.questions[0].options[1].label] }] }) });
  const first = await s.run('/review');
  assert.equal(first.result.kind, 'success', first.result.text);
  assert.match(first.result.text, /Code review · Completed/);
  assert.equal(s.questions[0].questions[0].options[1].label, 'Review uncommitted changes');
  assert.match(JSON.stringify(s.requests[0].messages), /Write user-facing review content in English/);
  const original = await readFile(new URL('../assets/codex/review/rubric.md', import.meta.url), 'utf8');
  assert.ok(JSON.stringify(s.requests[0]).includes(JSON.stringify(original).slice(1, -1)));
  await s.ctx.settings.update('locale', { preference: 'zh' });
  assert.match((await s.run('/review')).result.text, /完成 · 零发现/);
  assert.match(JSON.stringify(s.requests[1].messages), /Write user-facing review content in Simplified Chinese/);
  assert.equal(s.questions[1].questions[0].options[1].label, '审查未提交的更改');
});
test('审查开始后切换语言不改变本轮选择，报告字段和路径原样保留', async t => {
  const response = root => JSON.stringify({ findings: [{ title: '[P2] Preserve behavior', body: 'A concrete finding.', priority: 2, confidence_score: 0.9,
    code_location: { absolute_file_path: join(root, 'a.ts'), line_range: { start: 1, end: 1 } } }],
    overall_correctness: 'patch is incorrect', overall_explanation: 'One issue found.', overall_confidence_score: 0.9 });
  const s = await setup(t, response, { locale: 'en', answer: async request => {
    await s.ctx.settings.update('locale', { preference: 'zh' });
    const q = request.questions[0];
    return { answers: [{ id: q.id, selected: [q.options[q.id === 'review-scope' ? 2 : 0].label] }] };
  } });
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'success', result.result.text);
  assert.match(result.result.text, /Code review · Completed · Findings/);
  assert.match(s.questions[1].questions[0].question, /Select a commit/);
  assert.match(JSON.stringify(s.requests[0].messages), /Write user-facing review content in English/);
  assert.ok(result.result.text.includes(join(s.root, 'a.ts') + ':1–1'));
  assert.match(result.result.text, /\[P2\] Preserve behavior/);
  const path = join(s.journalDirectory, createHash('sha256').update(s.parent.id).digest('hex') + '.json');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).result.report.overallCorrectness, 'patch is incorrect');
  assert.match((await s.run('/review-status')).result.text, /One issue found/);
});
test('英文宿主反馈和失败信息跟随语言，缺少 settings 默认中文', async t => {
  const s = await setup(t, empty, { locale: 'en', error: true });
  assert.match((await s.command('/review-cancel')).result.text, /No review is running/);
  assert.match((await s.command('/review-status')).result.text, /No saved review result/);
  assert.match((await s.run('/review custom instructions')).result.text, /Code review · Failed/);
  const fallback = await setup(t);
  await fallback.run('/review 自定义要求');
  assert.match(JSON.stringify(fallback.requests[0].messages), /Write user-facing review content in Simplified Chinese/);
});
async function setup(t, response = empty, opts = {}) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-review-host-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true, stdio: 'ignore' });
  git('init', '-b', 'main'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test'); git('config', 'core.autocrlf', 'false');
  await writeFile(join(root, 'a.ts'), 'old\n'); git('add', '.'); git('commit', '-qm', 'initial');
  await writeFile(join(root, 'a.ts'), 'new\n');
  const requests = [];
  class Offline extends LlmAdapter {
    async *stream(options) {
      requests.push(options);
      if (opts.orchestrate && options.tools?.some(tool => tool.name === 'code_review')) {
        if (!options.messages.some(message => message.content.some(block => block.type === 'tool-result'))) {
          const block = { type: 'tool-call', id: 'native-review', name: 'code_review', arguments: JSON.stringify({ input: opts.reviewInput ?? '' }) };
          yield { type: 'block-start', index: 0, blockType: 'tool-call' };
          yield { type: 'tool-call-delta', index: 0, id: block.id, name: block.name, argumentsDelta: block.arguments };
          yield { type: 'block-end', index: 0, block };
          yield { type: 'finish', reason: { kind: 'tool-calls' } };
        } else {
          const text = '主会话报告：原生审查专家已完成，零发现。';
          yield { type: 'block-start', index: 0, blockType: 'text' };
          yield { type: 'text-delta', index: 0, text };
          yield { type: 'block-end', index: 0, block: { type: 'text', text } };
          yield { type: 'finish', reason: { kind: 'stop' } };
        }
        return;
      }
      if (opts.before) await opts.before(options, requests.length);
      if (opts.error) throw new Error('offline model failure');
      if (opts.tool && requests.length === 1) {
        const block = { type: 'tool-call', id: 'probe', name: opts.tool, arguments: JSON.stringify(opts.args ?? {}) };
        yield { type: 'block-start', index: 0, blockType: 'tool-call' };
        yield { type: 'tool-call-delta', index: 0, id: block.id, name: block.name, argumentsDelta: block.arguments };
        yield { type: 'block-end', index: 0, block };
        yield { type: 'finish', reason: { kind: 'tool-calls' } };
      } else {
        const text = typeof response === 'function' ? response(root) : response;
        yield { type: 'block-start', index: 0, blockType: 'text' };
        yield { type: 'text-delta', index: 0, text };
        yield { type: 'block-end', index: 0, block: { type: 'text', text } };
        yield { type: 'finish', reason: { kind: 'stop' } };
      }
    }
  }
  const ctx = new Context();
  if (opts.locale) {
    class MemorySettings extends SettingsProvider {
      writable = true;
      async load() { return { locale: { preference: opts.locale } }; }
      async persist() {}
    }
    await ctx.plugin(MemorySettings).await();
    ctx.settings.register('locale', z.object({ preference: z.string().required(false) }));
  }
  new SessionStore(ctx); new AgentRegistry(ctx); new SessionProjectionRegistry(ctx); new LlmRuntime(ctx);
  new SystemPrompt(ctx, { includeHarnessIdentity: false }); new ToolRuntime(ctx); new CommandRuntime(ctx); new AgentLoop(ctx, { agents: [] });
  new SubagentRuntime(ctx); new UserQuestionService(ctx); new ApprovalService(ctx, { policy: 'ask' });
  const questions = [];
  ctx.on('user-questions/request', async (request) => {
    questions.push(request);
    if (opts.answer) return opts.answer(request);
    return { answers: [{ id: request.questions[0].id, selected: ['审查未提交的更改'] }] };
  });
  await ctx.plugin(spawn, { providerName: 'spawn' }).await();
  ctx.llm.registerAdapter(['offline-review'], new Offline());
  let executions = 0;
  const tool = name => ({ name, description: '禁止执行的内存夹具', parameters: { type: 'object' },
    output: { schema: { type: 'string' }, render: (_, value) => [{ type: 'text', text: value }] }, async execute() { executions++; return 'executed'; } });
  ctx.tools.register(tool('dangerous_global'));
  for (const name of ['subagent', 'subagent_fork', 'summon_expert', 'web_search', 'view_image', 'read_image']) {
    if (opts.scopedSubagent && name === 'subagent') continue;
    ctx.tools.register(tool(name));
  }
  ctx.tools.register({ ...tool('native_git'), async execute(_args, exec) { executions++; assert.equal(ctx.approval.overrideOf(exec.agent.session), 'never'); return execFileSync('git', ['diff', 'HEAD'], { cwd: exec.agent.session.header.cwd, encoding: 'utf8', windowsHide: true }); } });
  ctx.on('agent/created', ({ agent }) => {
    if (opts.scopedSubagent) agent.ctx.tools.register(tool('subagent'));
    if (agent.session.header.parentSession === 'parent') {
      agent.ctx.tools.register(tool('dangerous_scoped'));
      agent.ctx.on('tools/pre-execute', async () => ({ kind: 'allow' }));
    }
  });
  const journalDirectory = join(root, '.git', 'review-records');
  const installed = ctx.plugin(plugin, { reportDirectory: journalDirectory, ...(opts.reviewModel ? { reviewModel: opts.reviewModel } : {}) }); await installed.await();
  const parent = await ctx.agents.create({ sessionId: 'parent', meta: { cwd: root }, agentOptions: { provider: 'offline-review', model: 'test' } });
  t.after(async () => { await parent.dispose(); await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }); });
  return { root, ctx, parent: parent.agent, installed, requests, questions, journalDirectory, executions: () => executions,
    command: input => ctx.commands.execute(parent.agent, input, [], new AbortController().signal),
    run: async input => {
      if (['/review-status', '/review-cancel'].includes(input)) return ctx.commands.execute(parent.agent, input, [], new AbortController().signal);
      const result = await ctx.tools.execute({ name: 'code_review', arguments: { input: input.slice('/review'.length).trim() }, agent: parent.agent, callId: 'review-test', signal: new AbortController().signal });
      return { result: { kind: result.isError ? 'error' : 'success', text: result.content.filter(b => b.type === 'text').map(b => b.text).join('') } };
    } };
}

test('空参数经原生问题选择，带文本不弹菜单也不解析选项', async t => {
  const s = await setup(t);
  assert.equal((await s.run('/review')).result.kind, 'success');
  assert.equal(s.questions.length, 1);
  assert.equal(s.questions[0].questions[0].options.length, 4);
  assert.equal((await s.run('/review --base main')).result.kind, 'success');
  assert.equal(s.questions.length, 1);
});

test('斜杠命令唤醒主会话，经原生 spawn 返回工具结果及主会话回答', async t => {
  const instructions = '重点检查 "权限绕过"\n保留 user\'s token 这个术语；不要把 --staged 当作选项。';
  const reviewInput = instructions;
  const s = await setup(t, empty, { orchestrate: true, reviewInput });
  const starts = [], ends = [], children = [];
  s.ctx.on('subagent/start', info => { starts.push(info); });
  s.ctx.on('subagent/end', info => {
    ends.push(info);
    const child = s.ctx.agents.get(info.id);
    if (child) children.push(child.session.snapshotEvents());
  });
  const accepted = await s.command(`/review ${reviewInput}`);
  assert.match(accepted.result.text, /提交到当前会话/);
  await s.parent.whenIdle();
  const events = s.parent.session.snapshotEvents();
  assert.ok(events.some(event => event.type === 'user/message' && event.data.source.plugin === '@michengai/dsh-code-review'));
  assert.ok(events.some(event => event.type === 'tool/call' && event.data.name === 'code_review'));
  assert.ok(events.some(event => event.type === 'tool/result' && JSON.stringify(event.data).includes('完成 · 零发现')));
  assert.ok(events.some(event => event.type === 'assistant/message' && JSON.stringify(event.data).includes('主会话报告')));
  assert.ok(events.some(event => event.type === 'subagent/catalog'));
  assert.equal(starts.length, 1); assert.equal(ends.length, 1);
  assert.ok(children[0].some(event => event.type === 'subagent/descriptor'));
  const childRequest = children[0].find(event => event.type === 'user/message');
  assert.equal(childRequest.data.content.find(block => block.type === 'text').text, instructions);
  assert.ok(events.some(event => event.type === 'user/message' && event.data.content.some(block => block.type === 'text' && block.text.includes(JSON.stringify(reviewInput)))));
  assert.equal(s.ctx.agents.list().length, 1);
  validateStoredEvents(s.parent.session.header, JSON.parse(JSON.stringify(events)));
});

test('真实 AgentLoop 独立上下文、DSH 模型路由、报告重放与清理', async t => {
  const s = await setup(t);
  s.parent.followup(createUserMessage({ content: [{ type: 'text', text: 'PARENT_SECRET_HISTORY' }], source: { kind: 'user' } }));
  await s.parent.whenIdle();
  s.requests.length = 0;
  s.ctx.systemPrompt.section({ name: 'ordinary-context', order: 10, text: 'MAIN_SECRET_PROMPT' });
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'success'); assert.match(result.result.text, /完成 · 零发现/);
  assert.equal(s.requests.length, 1); assert.ok(!JSON.stringify(s.requests).includes('PARENT_SECRET_HISTORY'));
  assert.ok(!JSON.stringify(s.requests).includes('MAIN_SECRET_PROMPT'));
  const original = await readFile(new URL('../assets/codex/review/rubric.md', import.meta.url), 'utf8');
  assert.ok(JSON.stringify(s.requests).includes(JSON.stringify(original).slice(1, -1)), '模型实际请求必须包含完整上游原文');
  assert.equal(s.ctx.agents.list().length, 1);
  const status = await s.run('/review-status'); assert.match(status.result.text, /完成 · 零发现/);
  assert.ok(s.parent.session.snapshotEvents().some(e => e.type === 'subagent/catalog'));
  validateStoredEvents(s.parent.session.header, JSON.parse(JSON.stringify(s.parent.session.snapshotEvents())));
});
test('有发现报告保留原生路径行号，不能丢失实际问题', async t => {
  const report = root => JSON.stringify({ findings: [{ title: '[P2] 保留删除行为的契约', body: '夹具中的旧实现被删除时会改变行为。', priority: 2, confidence_score: 0.7,
    code_location: { absolute_file_path: join(root, 'a.ts'), side: 'left', line_range: { start: 1, end: 1 } } }], overall_correctness: 'patch is incorrect', overall_explanation: '发现一项问题', overall_confidence_score: 0.7 });
  const s = await setup(t, report);
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'success'); assert.match(result.result.text, /完成 · 有发现/); assert.match(result.result.text, /a.ts:1–1/);
});
for (const tool of ['subagent', 'subagent_fork', 'summon_expert', 'web_search', 'view_image', 'read_image']) test(`原生工具限制关闭 ${tool}`, async t => {
  const s = await setup(t, empty, { tool });
  await s.run('/review');
  assert.equal(s.executions(), 0);
  assert.equal(s.ctx.agents.list().length, 1);
});

test('审查 Agent 使用宿主工具自行读取 Git diff，never 审批且父策略不变', async t => {
  const s = await setup(t, empty, { tool: 'native_git' });
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'success', result.result.text);
  assert.equal(s.executions(), 1);
  assert.doesNotMatch(JSON.stringify(s.requests[0].messages), /diff --git|repositoryRoot/);
  assert.match(JSON.stringify(s.requests[1].messages), /diff --git/);
  assert.equal(s.ctx.approval.overrideOf(s.parent.session), undefined);
});

test('模型错误不伪装为零发现，纯文本报告按 Codex 回退展示', async t => {
  const s = await setup(t, empty, { error: true });
  assert.equal((await s.run('/review')).result.kind, 'error');
  const plain = await setup(t, '尚不能确定问题，需要补充运行环境。');
  const result = await plain.run('/review');
  assert.equal(result.result.kind, 'success');
  assert.match(result.result.text, /尚不能确定问题/);
  assert.doesNotMatch(result.result.text, /零发现|输出无效/);
});

test('审查中工作区变化由 Agent 自行处理，不再运行快照复核', async t => {
  const s = await setup(t, empty, { before: async () => { await writeFile(join(s.root, 'a.ts'), 'changed meanwhile\n'); } });
  assert.equal((await s.run('/review')).result.kind, 'success');
});

test('取消和超时等待 Agent 收敛，无残留', async t => {
  const controller = new AbortController();
  const s = await setup(t, empty, { before: async () => { controller.abort(); } });
  const result = await runReview(s.ctx, s.parent, { mode: 'worktree' }, controller.signal);
  assert.equal(result.status, 'interrupted'); assert.equal(s.ctx.agents.list().length, 1);
  const slow = await setup(t, empty, { before: async options => {
    await new Promise(resolve => { if (options.signal.aborted) resolve(); else options.signal.addEventListener('abort', resolve, { once: true }); });
  } });
  const timed = await runReview(slow.ctx, slow.parent, { mode: 'worktree' }, new AbortController().signal, 10);
  assert.equal(timed.status, 'interrupted');
});
test('持久化后端失败明确返回错误', async t => {
  const s = await setup(t);
  s.ctx.on('session/flush', () => { throw new Error('disk full fixture'); });
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'error'); assert.match(result.result.text, /持久化失败/);
});
test('报告恢复能识别未完成的持久审查启动记录', async t => {
  const s = await setup(t);
  await s.run('/review');
  const path = join(s.journalDirectory, createHash('sha256').update(s.parent.id).digest('hex') + '.json');
  await writeFile(path, JSON.stringify({ version: 1, state: 'running', commandId: 'crashed-run' }));
  assert.match((await s.run('/review-status')).result.text, /中断/);
});
test('磁盘日志 JSON 往返后新 Agent 能恢复结构化报告', async t => {
  const s = await setup(t);
  const file = join(s.root, '.journal.json');
  s.ctx.on('session/flush', async session => { if (session.id === 'parent') await writeFile(file, JSON.stringify(session.snapshotEvents()), 'utf8'); });
  // 日志夹具不属于被审查工作区。
  await writeFile(join(s.root, '.git', 'info', 'exclude'), '.journal.json\n');
  await s.run('/review');
  await s.ctx.sessions.flush(s.parent.session);
  const seed = JSON.parse(await readFile(file, 'utf8'));
  validateStoredEvents(s.parent.session.header, seed);
  await s.ctx.agents.get('parent').whenIdle();
  // 使用新 Context 模拟进程重启，保持原会话身份以恢复插件原子记录。
  const restarted = new Context();
  new SessionStore(restarted); new AgentRegistry(restarted); new SessionProjectionRegistry(restarted); new LlmRuntime(restarted);
  new SystemPrompt(restarted, { includeHarnessIdentity: false }); new ToolRuntime(restarted); new CommandRuntime(restarted); new AgentLoop(restarted, { agents: [] });
  new SubagentRuntime(restarted); new UserQuestionService(restarted); new ApprovalService(restarted, { policy: 'ask' });
  await restarted.plugin(spawn, { providerName: 'spawn' }).await();
  await restarted.plugin(plugin, { reportDirectory: s.journalDirectory }).await();
  const restored = await restarted.agents.create({ sessionId: 'parent', seed, meta: { cwd: s.root }, agentOptions: s.parent.options });
  try {
    const result = await restarted.commands.execute(restored.agent, '/review-status', [], new AbortController().signal);
    assert.match(result.result.text, /完成 · 零发现/);
  } finally { await restored.dispose(); await restarted.fiber.dispose(); }
});
test('最终报告持久化失败与启动失败分别处理', async t => {
  const s = await setup(t);
  let flushes = 0;
  s.ctx.on('session/flush', () => { if (++flushes >= 2) throw new Error('final output failed'); });
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'error'); assert.match(result.result.text, /报告持久化失败/); assert.equal(s.requests.length, 1);
});
test('卸载插件取消运行中的审查并等待清理', { timeout: 15000 }, async t => {
  let notify;
  const entered = new Promise(resolve => { notify = resolve; });
  const s = await setup(t, empty, { before: async options => {
    notify();
    await new Promise(resolve => { if (options.signal.aborted) resolve(); else options.signal.addEventListener('abort', resolve, { once: true }); });
  } });
  const running = s.run('/review');
  await entered;
  await s.installed.dispose();
  const result = await running;
  assert.equal(result.result.kind, 'error'); assert.match(result.result.text, /中断/); assert.equal(s.ctx.agents.list().length, 1);
});

for (const [label, id] of [['对比基准分支', 'review-base'], ['审查某次提交', 'review-commit'], ['自定义审查要求', 'review-instructions']]) {
  test(`原生菜单：${label}，回答前不启动审查模型`, async t => {
    const instructions = '检查 "权限"\n--base main 保持原文';
    const s = await setup(t, empty, { answer: async request => {
      assert.equal(s.requests.length, 0);
      const q = request.questions[0];
      if (q.id === 'review-scope') return { answers: [{ id: q.id, selected: [label] }] };
      assert.equal(q.id, id);
      return { answers: [{ id: q.id, selected: id === 'review-instructions' ? [] : [q.options[0].label], ...(id === 'review-instructions' ? { custom: instructions } : {}) }] };
    } });
    const result = await s.run('/review');
    assert.equal(result.result.kind, 'success', result.result.text);
    assert.equal(s.questions.length, 2);
    assert.equal(s.requests.length, 1);
    const data = s.requests[0].messages.filter(m => m.role === 'user').flatMap(m => m.content).find(b => b.type === 'text').text;
    if (id === 'review-instructions') assert.equal(data, instructions);
    if (id === 'review-base') assert.match(data, /Run `git diff [a-f0-9]{40}`/);
    if (id === 'review-commit') assert.match(data, /commit [a-f0-9]{40}/);
  });
}

test('空 /review 完整主会话链路产生原生范围选择', async t => {
  const s = await setup(t, empty, { orchestrate: true });
  await s.command('/review');
  await s.parent.whenIdle();
  assert.equal(s.questions.length, 1);
  assert.equal(s.questions[0].agent, s.parent);
  assert.ok(s.parent.session.snapshotEvents().some(e => e.type === 'tool/result' && JSON.stringify(e.data).includes('完成 · 零发现')));
});

test('范围选择取消释放并发占用，不启动模型或覆写报告', async t => {
  let notify;
  const entered = new Promise(resolve => { notify = resolve; });
  const s = await setup(t, empty, { answer: async request => {
    notify();
    return new Promise((resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new Error('用户取消范围选择')), { once: true });
    });
  } });
  const pending = s.run('/review');
  await entered;
  assert.match((await s.run('/review')).result.text, /已有审查/);
  await s.command('/review-cancel');
  assert.equal((await pending).result.kind, 'error');
  assert.equal(s.requests.length, 0);
  assert.match((await s.command('/review-status')).result.text, /没有已保存/);
  assert.equal((await s.run('/review 自定义要求')).result.kind, 'success');
});

test('问题服务无回答器或用户跳过时明确失败，不默认开跑', async t => {
  for (const answer of [async () => { throw new Error('NO_PROVIDER'); }, async () => ({ answers: [] })]) {
    const s = await setup(t, empty, { answer });
    const result = await s.run('/review');
    assert.equal(result.result.kind, 'error');
    assert.equal(s.requests.length, 0);
  }
});

test('短任务交给原生子 Agent，绝不注入全仓 JSON 或只读快照工具', async t => {
  const s = await setup(t);
  await s.run('/review');
  const request = s.requests[0];
  const text = JSON.stringify(request.messages);
  assert.doesNotMatch(text, /repositoryRoot|fingerprint|oldPath|newPath/);
  assert.ok(!request.tools.some(t => ['review_read', 'review_search'].includes(t.name)));
  assert.ok(request.tools.some(t => t.name === 'dangerous_global'));
});

test('可选审查模型覆盖，默认模型由原生 spawn 继承', async t => {
  const s = await setup(t, empty, { reviewModel: 'review-test-model' });
  await s.run('/review');
  assert.equal(s.requests[0].model, 'review-test-model');
});

test('自定义历史要求不会被工作区无变更短路，也不预读仓库内容', async t => {
  const s = await setup(t);
  execFileSync('git', ['checkout', '--', 'a.ts'], { cwd: s.root, windowsHide: true });
  const instruction = '审查上一提交，请自行检查 git show HEAD';
  assert.equal((await s.run('/review ' + instruction)).result.kind, 'success');
  assert.equal(s.requests.length, 1);
  assert.equal(s.requests[0].messages.filter(m => m.role === 'user')[0].content[0].text, instruction);
});

test('subagent 仅在父子 Agent 本地注册时仍可启动审查，局部委派不能执行', async t => {
  const s = await setup(t, empty, { scopedSubagent: true, tool: 'native_git' });
  assert.equal(s.ctx.tools.get('subagent'), undefined);
  assert.ok(s.ctx.tools.get('subagent', s.parent));
  const result = await s.run('/review');
  assert.equal(result.result.kind, 'success', result.result.text);
  assert.equal(s.executions(), 1);
  assert.equal(s.ctx.agents.list().length, 1);
  const denied = await setup(t, empty, { scopedSubagent: true, tool: 'subagent' });
  assert.equal((await denied.run('/review')).result.kind, 'success');
  assert.equal(denied.executions(), 0);
  assert.match(JSON.stringify(denied.requests[1].messages), /审查模式不提供/);
});
