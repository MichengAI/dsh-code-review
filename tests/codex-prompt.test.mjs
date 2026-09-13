import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { REVIEW_PROMPT, parseReport, renderReport } from '../lib/report.js';

const root = resolve('fixture');
function report(priority) {
  return { findings: [{ title: '[P2] 保留调用契约', body: '指定输入会触发异常。', confidence_score: 0.25,
    ...(priority === undefined ? {} : { priority }), code_location: { absolute_file_path: resolve(root, 'a.ts'), line_range: { start: 1, end: 1 } } }],
    overall_correctness: 'patch is incorrect', overall_explanation: '存在可操作的问题。', overall_confidence_score: 0.6 };
}
test('运行提示词逐字保留固定提交的完整原文且保留上游来源校验', () => {
  const bytes = readFileSync('assets/codex/review/rubric.md');
  const source = JSON.parse(readFileSync('assets/codex/review/source.json', 'utf8').replace(/^\uFEFF/, ''));
  assert.equal(source.commit, 'a592c38c16cdd7623dacc9168926ebccedfb67d3');
  assert.equal(source.sha256, 'ec60e7f36a1d1c2679ce095c0205ecc56f7dd8fb57707a13ef362072390f219f');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
  assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex'), source.gitBlob);
  assert.equal(REVIEW_PROMPT, bytes.toString('utf8'));
  assert.doesNotMatch(REVIEW_PROMPT, /DSH 平台适配|review_read|review_search/);
});
test('接受 Codex 原生字段，不设置置信度过滤；不符合 Rust 字段类型时保留文本', () => {
  for (const priority of [0, 2, 3]) {
    const result = parseReport(JSON.stringify(report(priority)));
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].confidenceScore, 0.25);
    assert.equal(result.overallCorrectness, 'patch is incorrect');
    assert.equal(result.overallConfidenceScore, 0.6);
    assert.match(renderReport(result), /存在可操作的问题/);
  }
});
test('Codex 回退顺序保留 JSON 包裹与普通文本，不额外校验 diff 行', () => {
  const value = report(1);
  value.findings[0].code_location.line_range = { start: 9999, end: 10000 };
  assert.equal(parseReport('```json\n' + JSON.stringify(value) + '\n```').findings[0].start, 9999);
  const raw = '无法判断，请提供更多上下文。';
  assert.equal(parseReport(raw).summary, raw);
  assert.equal(parseReport(raw).format, 'text');
  assert.equal(parseReport('{invalid}').summary, '{invalid}');
});

test('已有旧版报告仍可显示，不伪造缺失的整体结论或置信度', () => {
  const text = renderReport({ summary: '旧版报告', findings: [{ title: '旧版发现', body: '旧版原因', priority: 2, side: 'right', path: 'a.ts', start: 1, end: 1, evidence: 'new' }], limitations: [] });
  assert.match(text, /\[P2\] 旧版发现/);
  assert.doesNotMatch(text, /undefined|模型判断|模型置信度/);
});

test('上游 Rust 结构要求 priority 整数；不匹配时按原文回退', () => {
  for (const priority of [undefined, null]) {
    const raw = JSON.stringify(report(priority));
    assert.equal(parseReport(raw).format, 'text');
    assert.equal(parseReport(raw).summary, raw);
  }
});
