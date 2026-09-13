import { readFileSync } from 'node:fs';

// 直接使用固定上游版本原文，不追加快照、字段扩展或范围限制。
export const CODEX_REVIEW_PROMPT = readFileSync(new URL('../assets/codex/review/rubric.md', import.meta.url), 'utf8');
export const REVIEW_PROMPT = CODEX_REVIEW_PROMPT;
