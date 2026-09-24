import { translate, type Locale } from './i18n.js';
export { REVIEW_PROMPT } from './prompt.js';

// 保留旧报告字段用于恢复；新报告不采集额外证据或要求 side/limitations 扩展。
export interface Finding { title: string; body: string; priority: number | null; path: string; side?: 'left' | 'right'; start: number; end: number; evidence?: string; confidenceScore?: number }
export interface Report { findings: Finding[]; summary: string; limitations: string[]; format?: 'structured' | 'text'; overallCorrectness?: string; overallConfidenceScore?: number }

function findingList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value && typeof value === 'object' ? [value] : [];
}

function priorityOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3) return value;
  if (typeof value !== 'string') return null;
  const match = /^(?:\[?\s*P\s*)?([0-3])\]?$/i.exec(value.trim());
  return match ? Number(match[1]) : null;
}

function linesOf(raw: unknown): { start: number; end: number } | undefined {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) return { start: raw, end: raw };
  if (raw && typeof raw === 'object' && Number.isInteger((raw as { start?: unknown }).start) && Number.isInteger((raw as { end?: unknown }).end)) {
    return { start: (raw as { start: number }).start, end: (raw as { end: number }).end };
  }
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const [from, to] = raw.split(/\s*[-–]\s*/);
  const start = Number(from), end = Number(to ?? from);
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end >= 0 ? { start, end } : undefined;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Codex 正文字段优先；模型常用的 file/line、单个对象和 P1 也收成同一份报告。 */
function decode(raw: string): Report {
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('报告格式不匹配。');
  const record = value as Record<string, unknown>;
  const findings = findingList(record.findings).flatMap((item): Finding[] => {
    if (!item || typeof item !== 'object') return [];
    const finding = item as Record<string, unknown>;
    const title = textOf(finding.title), body = textOf(finding.body);
    if (!title || !body) return [];
    const location = finding.code_location && typeof finding.code_location === 'object' ? finding.code_location as Record<string, unknown> : {};
    const lines = linesOf(location.line_range) ?? linesOf(location.line) ?? linesOf(finding.line);
    const path = textOf(location.absolute_file_path) || textOf(location.file) || textOf(location.path) || textOf(finding.file) || textOf(finding.path);
    const confidence = typeof finding.confidence_score === 'number' ? finding.confidence_score : undefined;
    return [{ title, body, priority: priorityOf(finding.priority), path, start: lines?.start ?? 0, end: lines?.end ?? 0, ...(confidence === undefined ? {} : { confidenceScore: confidence }) }];
  });
  const summary = textOf(record.overall_explanation);
  if (!summary && !findings.length) throw new Error('报告格式不匹配。');
  const confidence = record.overall_confidence_score;
  return { findings, summary, limitations: [], format: 'structured',
    ...(typeof record.overall_correctness === 'string' ? { overallCorrectness: record.overall_correctness } : {}),
    ...(typeof confidence === 'number' ? { overallConfidenceScore: confidence } : {}) };
}

/** 跳过字符串后的配对对象。说明里的 `src/{a,b}` 不会被当成报告。 */
function objectAt(raw: string, start: number): string | undefined {
  if (raw[start] !== '{') return undefined;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return undefined;
}

/** 审查标准仍是 Codex JSON。会话只使用解析后的结论和发现，说明中的花括号不能挡住后面的报告。 */
export function parseReport(raw: string): Report {
  const candidates: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const slice = objectAt(raw, i);
    if (!slice) continue;
    if (slice.includes('"findings"') && slice.includes('"overall_correctness"') && slice.includes('"overall_explanation"')) candidates.push(slice);
    i += slice.length - 1;
  }
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i];
    if (candidate === undefined) continue;
    try { return decode(candidate); } catch { /* 字段类型不符时继续找下一份。 */ }
  }
  return { findings: [], summary: raw, limitations: [], format: 'text' };
}

export function renderReport(report: Report, locale: Locale = 'zh'): string {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return [report.summary, ...report.findings.map(f => {
    const location = f.path ? `\n${f.path}${f.start || f.end ? `:${f.start}–${f.end}` : ''}${f.side === 'left' ? t('（基线）') : ''}` : '';
    return `${/^\[P[0-3]\]/.test(f.title) || f.priority == null ? '' : `[P${f.priority}] `}${f.title}${location}\n${f.body}${f.evidence ? `\n${t('证据：')}${f.evidence}` : ''}`;
  }),
    ...report.limitations.map(l => `${t('未覆盖：')}${l}`)].filter(Boolean).join('\n\n');
}
