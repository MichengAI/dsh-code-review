# Changelog

## 0.1.6 — 2026-09-25

## 简体中文

- 将 peer 与开发依赖对齐官方 DSH `0.1.7-rc.2`，只支持该宿主；已在该宿主上完成离线回归与安装包端到端验证。

## English

- Align peer and development dependencies with official DSH `0.1.7-rc.2` and support that host only; offline regression and packaged host integration were verified on it.

## 0.1.5 — 2026-09-24

## 简体中文

- 只支持 DSH `0.1.7-rc.1`。
- `/review` 的菜单说明改为「选择范围或输入自定义要求」。
- 审查结果直接给出结论和发现，不再把 JSON 贴进会话。看不清改动时，不会把补丁说成正确。

## English

- Support only DSH `0.1.7-rc.1`.
- The `/review` menu description is now “Select a scope or enter custom instructions”.
- Reviews state the verdict and findings directly, without pasting JSON into the conversation. A review that cannot inspect the diff will not call the patch correct.

## 0.1.4 — 2026-09-18

## 简体中文

- `/` 菜单为 `/review`、`/review-status`、`/review-cancel` 补上图标和中文标题，描述继续跟随宿主语言。
- 将 npm 包描述改为与 GitHub 仓库一致的中英双语。

## English

- Add slash-menu icons and localized titles for `/review`, `/review-status`, and `/review-cancel`; descriptions still follow the host locale.
- Make the npm package description bilingual to match the GitHub About text.

## 0.1.3 — 2026-09-18

## 简体中文

- 将 peer 与开发依赖对齐官方 DSH `0.1.6-alpha.2`，并适配 `SubagentRuntime` 构造函数；已在该宿主上完成离线回归与安装包端到端验证。

## English

- Align peer and development dependencies with official DSH `0.1.6-alpha.2`, update the `SubagentRuntime` constructor, and verify offline regression plus packaged host integration on that host.

## 0.1.2 — 2026-09-16

## 简体中文

- 将 peer 与开发依赖对齐官方 DSH `0.1.6-alpha.1`，并在该宿主上完成离线回归与安装包端到端验证。

## English

- Align peer and development dependencies with official DSH `0.1.6-alpha.1`, and verify offline regression plus packaged host integration on that host.

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
