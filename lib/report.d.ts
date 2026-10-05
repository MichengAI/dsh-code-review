import { type Locale } from './i18n.js';
export { REVIEW_PROMPT } from './prompt.js';
export interface Finding {
    title: string;
    body: string;
    priority: number | null;
    path: string;
    side?: 'left' | 'right';
    start: number;
    end: number;
    evidence?: string;
    confidenceScore?: number;
}
export interface Report {
    findings: Finding[];
    summary: string;
    limitations: string[];
    format?: 'structured' | 'text';
    overallCorrectness?: string;
    overallConfidenceScore?: number;
}
/** 审查标准仍是 Codex JSON。会话只使用解析后的结论和发现，说明中的花括号不能挡住后面的报告。 */
export declare function parseReport(raw: string): Report;
export declare function renderReport(report: Report, locale?: Locale): string;
