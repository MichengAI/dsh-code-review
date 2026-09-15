# Changelog

## 0.1.1 — 2026-09-15

## 简体中文

- 增加 GitHub Actions：推送正式版本标签后，通过 npm Trusted Publishing 发布，并同步中英 GitHub Release 说明。

## English

- Add GitHub Actions so a version tag publishes via npm Trusted Publishing and syncs bilingual GitHub Release notes.

## 0.1.0 — 2026-09-13

## 简体中文

- 在主会话使用 `/review` 发起原生独立 Agent 审查，支持基准分支、未提交更改、指定提交及自定义要求；报告返回当前会话，可查看最近结果或取消运行。
- 保留固定版本的 Codex 英文审查规范，报告语言跟随宿主中英文偏好，并提供双语使用说明。
- 支持 DSH `0.1.5-rc.2`，需要 Node.js ≥ `22.19.0`、Git、原生 spawn 与问题回答器。未保存语言偏好时默认中文；审查范围覆盖、发现准确性和输出语言仍取决于模型表现。

## English

- Start a native independent-agent review with `/review` in the main conversation. Choose a base branch, uncommitted changes, a commit, or custom instructions; receive the report in the same conversation, recover the latest result, or cancel a run.
- Preserve the original English Codex rubric from a fixed source version, follow the host's Chinese or English preference for reports, and provide bilingual documentation.
- Supports DSH `0.1.5-rc.2` and requires Node.js ≥ `22.19.0`, Git, native spawn, and a question answerer. Chinese is the default without a saved locale preference; review coverage, finding accuracy, and output language still depend on model behavior.
