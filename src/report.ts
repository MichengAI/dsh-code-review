import { translate, type Locale } from './i18n.js';
export { REVIEW_PROMPT } from './prompt.js';

// 保留旧报告字段用于恢复；新报告不采集额外证据或要求 side/limitations 扩展。
export interface Finding { title: string; body: string; priority: number | null; path: string; side?: 'left' | 'right'; start: number; end: number; evidence?: string; confidenceScore?: number }
export interface Report { findings: Finding[]; summary: string; limitations: string[]; format?: 'structured' | 'text'; overallCorrectness?: string; overallConfidenceScore?: number }

function decode(raw: string): Report {
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.findings) || typeof value.overall_explanation !== 'string'
    || typeof value.overall_correctness !== 'string'
    || typeof value.overall_confidence_score !== 'number') throw new Error('报告格式不匹配。');
  const findings = value.findings.map((f: any): Finding => {
    const location = f?.code_location, range = location?.line_range;
    if (typeof f?.title !== 'string' || typeof f.body !== 'string' || typeof f.confidence_score !== 'number'
      || typeof location?.absolute_file_path !== 'string' || !Number.isInteger(range?.start) || !Number.isInteger(range?.end)
      || !Number.isInteger(f.priority) || f.priority < -2147483648 || f.priority > 2147483647
      || range.start < 0 || range.end < 0 || range.start > 4294967295 || range.end > 4294967295) throw new Error('缺陷字段不匹配。');
    return { title: f.title, body: f.body, priority: f.priority ?? null, path: location.absolute_file_path,
      start: range.start, end: range.end, confidenceScore: f.confidence_score };
  });
  return { findings, summary: value.overall_explanation, limitations: [], format: 'structured',
    overallCorrectness: value.overall_correctness, overallConfidenceScore: value.overall_confidence_score };
}

/** 与 Codex 一致：完整 JSON、首尾花括号截取、最后保留原始文本。 */
export function parseReport(raw: string): Report {
  try { return decode(raw); } catch { /* 继续按上游规则尝试正文中的 JSON。 */ }
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return decode(raw.slice(start, end + 1)); } catch { /* 普通文字仍是有效交付，不伪称零发现。 */ }
  }
  return { findings: [], summary: raw, limitations: [], format: 'text' };
}

export function renderReport(report: Report, locale: Locale = 'zh'): string {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return [report.summary, ...report.findings.map(f => `${/^\[P[0-3]\]/.test(f.title) || f.priority == null ? '' : `[P${f.priority}] `}${f.title}\n${f.path}:${f.start}–${f.end}${f.side === 'left' ? t('（基线）') : ''}\n${f.body}${f.evidence ? `\n${t('证据：')}${f.evidence}` : ''}`),
    ...report.limitations.map(l => `${t('未覆盖：')}${l}`)].filter(Boolean).join('\n\n');
}
