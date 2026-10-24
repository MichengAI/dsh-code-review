# Changelog

## Unreleased / 未发布

## 1.0.3 — 2026-10-24

## 简体中文

- 宿主准入机制全面升级：声明 `engines.dsh: ">=0.2.0-rc.1 <0.3.0-0"`，全面开放对 DeepSeek Harness 整个 `0.2.x` 系列的支持（包含已支持的 `0.2.0-rc.1` 起及后续全部 alpha/rc/正式版），非破坏性宿主升级无需再重复发版。
- 解除 peerDependencies 逐版本锁定：所有 `@deepseek-ai/dsh-*` peer 依赖统一放宽至 `0.2.x` 代际范围。
- 升级编译期开发依赖：将全部 `@deepseek-ai/dsh-*` 开发依赖对齐升级至最新 `0.2.1-rc.3`。

## English

- Upgrade host admission policy: Declare `engines.dsh: ">=0.2.0-rc.1 <0.3.0-0"` to support the entire DeepSeek Harness `0.2.x` line (including `0.2.0-rc.1` onwards, future alphas, RCs, and stable releases) without requiring routine plugin version bumps.
- Decouple peerDependencies locks: Broaden all `@deepseek-ai/dsh-*` peer dependencies to the `0.2.x` generation range.
- Upgrade build-time development dependencies: Synchronize all `@deepseek-ai/dsh-*` devDependencies to latest `0.2.1-rc.3`.

## 1.0.2 — 2026-10-24

## 简体中文

- 支持最新官方 DSH `0.2.1-rc.3`：将 peer 支持版本矩阵扩展至 `0.2.1-rc.3`。

## English

- Support latest official DSH `0.2.1-rc.3`: extend the peer matrix to include `0.2.1-rc.3`.

## 1.0.1 — 2026-10-17

## 简体中文

- 支持最新官方 DSH `0.2.1-rc.2`：将 peer 支持版本矩阵扩展至 `0.2.1-rc.2`，开发依赖与官方 DSH `0.2.1-rc.2` 完全对齐。

## English

- Support latest official DSH `0.2.1-rc.2`: extend the peer matrix to include `0.2.1-rc.2` and align development dependencies with official DSH `0.2.1-rc.2`.

## 1.0.0 — 2026-10-17

## 简体中文

- 版本号升级至 1.0.0，支持版本矩阵聚焦 DSH 0.2.0 及后续正式 RC 版本（`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`）。
- 移除已废弃的 0.1.x 和中间 alpha 版本声明，清理老版本兼容分支（包括早期动态导入和过时的语言偏好探测）。
- 开发依赖对齐官方最新 DSH `0.2.1-rc.1`（含 Cordis `4.0.5` 与 Schemastery `3.18.5`）。

## English

- Bump version to 1.0.0 and focus the supported host matrix on DSH 0.2.0 and later release candidates (`0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`).
- Drop legacy 0.1.x peers and intermediate alpha declarations; remove outdated compatibility fallbacks.
- Align development dependencies with official DSH `0.2.1-rc.1` (including Cordis `4.0.5` and Schemastery `3.18.5`).

## 0.1.16 — 2026-10-15

## 简体中文

- 在仍受支持的旧版 DSH 上，代码审查可以再次启动，不再因为宿主接口差异而失败。

## English

- Code review starts again on supported older DSH versions instead of failing on a host interface difference.

## 0.1.15 — 2026-10-15

## 简体中文

- 支持 DSH `0.2.1-alpha.3`：所有 `@deepseek-ai/dsh*` peer 列表追加该版本；开发依赖对齐宿主 `0.2.1-alpha.3`（含 Cordis `4.0.5-alpha.2`、Schemastery `3.18.5-alpha.2`）。
- 适配子 Agent 破坏性变更：`ctx.subagents.start` / 启动期 `persona` / `toolFilter` 已移除，改为 `startActivation`（`delivery: 'caller'`）；审查角色与委派工具过滤在子 Agent `agent/created` 时以 scoped persona 与 `tools.restrict` 恢复。
- 命令、工具名与阻塞式 `ask` 选择路径不变。

## English

- Support DSH `0.2.1-alpha.3`: append that version to every `@deepseek-ai/dsh*` peer list and pin development dependencies to host `0.2.1-alpha.3` (including Cordis `4.0.5-alpha.2` and Schemastery `3.18.5-alpha.2`).
- Adapt the subagent breaking change: `ctx.subagents.start` and start-time `persona` / `toolFilter` are gone; use `startActivation` with `delivery: 'caller'`, and restore the review persona plus delegated-tool denylist on the child's `agent/created` via a scoped persona section and `tools.restrict`.
- Commands, tool names, and the blocking `ask` selection path are unchanged.

## 0.1.14 — 2026-10-13

## 简体中文

- 审查工具更名为 `dsh_code_review`，用户命令 `/review`、`/review-status` 和 `/review-cancel` 保持不变。

## English

- Rename the review tool to `dsh_code_review`; `/review`, `/review-status`, and `/review-cancel` remain unchanged.

## 0.1.13 — 2026-10-12

## 简体中文

- 支持 DSH `0.2.1-alpha.2`，放宽 Cordis 依赖为 ^4.0.1。

## English

- Support DSH `0.2.1-alpha.2` and allow Cordis ^4.0.1.

## 0.1.12 — 2026-10-07

## 简体中文

- 审查报告改为 Markdown，直接显示状态、发现和带行号的文件链接。
- 审查可以使用宿主的网页和看图工具。权限不够时说明缺口并结束，不再弹出审批，也不要求提权。

## English

- Review reports are Markdown, showing the status, findings, and file links with line numbers.
- Reviews can use the host's web and image tools. If access is limited, the report explains the gap and finishes, without an approval prompt or a request to raise permissions.

## 0.1.11 — 2026-10-06

## 简体中文

- 已安装插件列表显示「Code Review」和中文简介，不再只用包名。显示名来自 `locale/zh.json` 和 `locale/en.json` 的 `meta.title`、`meta.description`。
- 从 GitHub 安装时已包含编译后的运行文件，不必再手动构建。

## English

- The installed-plugin list shows “Code Review” and a localized description instead of the package name. Titles and descriptions come from `meta.title` and `meta.description` in `locale/zh.json` and `locale/en.json`.
- Installing from GitHub now includes the compiled runtime, so no manual build is required.

## 0.1.10 — 2026-09-30

## 简体中文

- 斜杠菜单的标题、说明和输入提示跟随宿主语言，不再沿用注册表里的中文。

## English

- Slash-menu titles, descriptions, and input hints follow the host language instead of the Chinese registry strings.

## 0.1.9 — 2026-09-30

## 简体中文

- 将 DSH peer 的确切版本列表加入 `0.2.0-rc.2`。当前准入版本为 `0.1.2-rc.1`、`0.1.5-rc.1`、`0.1.5-rc.2`、`0.1.5-rc.3`、`0.1.7-rc.1`、`0.1.7-rc.2`、`0.2.0-rc.1`、`0.2.0-rc.2`。不写版本范围，也不包含 alpha、`0.0.1` RC，以及 `0.1.0` / `0.1.1` RC。
- 开发依赖对齐当前宿主 `0.2.0-rc.2`。官方说明没有插件 API 破坏性变更；插件直接使用的类型除 `userQuestions` 新增可选的限时问答外没有变化，审查仍走原来的阻塞式 `ask`。
- 离线回归 51 项和隔离 profile 端到端 33 项已在 `dsh 0.2.0-rc.2` 上通过。

## English

- Add `0.2.0-rc.2` to the exact DSH peer list. Admitted hosts are `0.1.2-rc.1`, `0.1.5-rc.1`, `0.1.5-rc.2`, `0.1.5-rc.3`, `0.1.7-rc.1`, `0.1.7-rc.2`, `0.2.0-rc.1`, and `0.2.0-rc.2`. Ranges, alphas, `0.0.1` release candidates, and `0.1.0` / `0.1.1` release candidates are excluded.
- Pin development dependencies to the current host, `0.2.0-rc.2`. The official notes do not describe a plugin API break. Direct types used by this plugin are unchanged aside from optional timed questions on `userQuestions`; reviews still use the existing blocking `ask`.
- Offline regression (51) and isolated-profile end-to-end tests (33) passed on `dsh 0.2.0-rc.2`.

## 0.1.8 — 2026-09-28

## 简体中文

- DSH peer 改为确切版本列表，覆盖 npm 上已发布的全部 `0.1` 与 `0.2` RC：`0.1.0-rc.2`、`0.1.0-rc.3`、`0.1.0-rc.6`、`0.1.0-rc.7`、`0.1.0-rc.8`、`0.1.1-rc.1`、`0.1.1-rc.2`、`0.1.2-rc.1`、`0.1.5-rc.1`、`0.1.5-rc.2`、`0.1.5-rc.3`、`0.1.7-rc.1`、`0.1.7-rc.2`、`0.2.0-rc.1`。不写版本范围，也不包含 alpha 或 `0.0.1` RC。
- 开发依赖对齐当前宿主 `0.2.0-rc.1`。DSH peer 标为 optional，避免 npm 在多版本列表里解析到旧 RC。离线回归 51 项和隔离 profile 端到端 33 项已在 `dsh 0.2.0-rc.1` 上通过。
- `0.1.7-rc.1` 与 `0.1.7-rc.2` 此前已做过隔离安装和宿主测试。其余列入的 RC 只保证能通过 peer 准入，尚未逐个验收。

## English

- Declare DSH peers as every published `0.1` and `0.2` release candidate: `0.1.0-rc.2`, `0.1.0-rc.3`, `0.1.0-rc.6`, `0.1.0-rc.7`, `0.1.0-rc.8`, `0.1.1-rc.1`, `0.1.1-rc.2`, `0.1.2-rc.1`, `0.1.5-rc.1`, `0.1.5-rc.2`, `0.1.5-rc.3`, `0.1.7-rc.1`, `0.1.7-rc.2`, and `0.2.0-rc.1`. Ranges, alphas, and `0.0.1` release candidates are excluded.
- Pin development dependencies to the current host, `0.2.0-rc.1`. Mark DSH peers optional so npm does not resolve an older release candidate from the multi-version list. Offline regression (51) and isolated-profile end-to-end tests (33) passed on `dsh 0.2.0-rc.1`.
- `0.1.7-rc.1` and `0.1.7-rc.2` already had isolated installation and host tests. The other listed release candidates are admitted by peers and have not been validated individually.

## 0.1.7 — 2026-09-25

## 简体中文

- 支持范围放宽为 DSH `0.1.7-rc.1` 起、`0.2.0` 之前的所有版本（含各 RC 与正式版），宿主再发新 RC 无需插件跟版；`0.2.0` 起需要重新验证。
- 已在 `0.1.7-rc.1` 与 `0.1.7-rc.2` 两个宿主上分别完成隔离安装、peer 检查与打包后宿主测试。

## English

- Widen the supported range to DSH `0.1.7-rc.1` up to, but excluding, `0.2.0` — every RC and release on that line — so new host RCs no longer require a plugin release; `0.2.0` and later need revalidation.
- Verified on both `0.1.7-rc.1` and `0.1.7-rc.2` with isolated installation, peer checks, and packaged host tests.

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
