# DSH Code Review

DeepSeek Harness 原生代码审查插件，包名 `@michengai/dsh-code-review`，主命令 `/review`。以固定 Codex 源码版本为基准，将审查任务交给 DSH 原生独立子 Agent，自行检查 Git、代码、调用方、测试和项目规则。

兼容 **DSH 0.1.5-rc.2、Node.js ≥22.19.0、Git**。通过 `dsh.bundle.patch` 加载，不是 SKILL.md 技能包。

## 使用

| 输入 | 行为 |
| --- | --- |
| `/review` | 原生问题界面选择审查目标 |
| `/review 检查上一提交的权限回归` | 原文交给审查 Agent，自行查找所需历史与代码 |
| `/review-status` | 查看进度或恢复最近报告 |
| `/review-cancel` | 取消范围选择或正在运行的审查 |

空输入提供四项：对比基准分支、审查未提交更改、审查某次提交、自定义要求。基准分支显示本地分支；提交显示最近 100 条。DSH 问题组件允许自由输入其他引用。带文本时不解析 CLI 参数：`--base main`、`.`、`status` 都是普通自定义文本。

子 Agent 的首条消息只有短任务。例如未提交审查使用 Codex 原文：

> Review the current code changes (staged, unstaged, and untracked files) and provide prioritized findings.

不再提前读取全仓、生成 diff JSON、注入改动行号数组或注册 review_read/review_search。自定义要求不再固定到工作区快照；审查范围和所需上下文由审查 Agent 自行判断和获取。没有变更、仓库冲突或上下文不足也由 Agent 检查后说明，不再由插件预判。

## 与 Codex 源码对应

参考固定提交 `a592c38c16cdd7623dacc9168926ebccedfb67d3`，不宣称与未来版本同步。

| Codex 行为 | DSH 实现 |
| --- | --- |
| 四类 ReviewTarget | 原生问题选择或自定义原文 |
| review_request 短任务模板 | 未提交、分支、提交、Custom 文本对应上游模板 |
| 分支预计算 merge-base | upstream 有基准分支尚未包含的提交时优先 upstream；引用无法解析时交给 Agent 查找 |
| 独立一次性审查会话、无 initial_history | 原生 spawn，不传父会话历史 |
| 完整 review rubric | 英文原文逐字保留，不追加自定义适配或输出扩展 |
| review_model，否则当前模型 | 可选 reviewModel，否则继承父 Agent 模型配置 |
| never 审批、禁用 web/collab/image | 子会话 never 审批，限制对应原生工具；不修改父会话策略 |
| Agent 自行操作工具检查代码 | 继承 DSH 工具与权限，使用原生工具呈现，不提供自建快照工具 |
| JSON → 截取 JSON → 纯文本回退 | 同顺序解析，不以快照验证行号；纯文本保留，不伪称零发现 |
| 最终报告回到主会话 | 原生工具结果回到主会话，要求主 Agent 原样呈现 |

任务输入与提示词对齐源码；DSH 的问题组件、工具名称、工具权限执行、事件展示及主会话返回链路仍由 DSH 实现，因此不是 Codex Desktop 界面的像素复刻，也不保证不同模型产生相同结果。Web/Desktop 的实际渲染和在线模型效果需人工验收。

审查要求不生成修复；这不等于工具层全部只读。与 Codex 一样，执行能力取决于宿主权限和沙箱，`never` 表示需要审批的操作被拒绝，不代表允许的终端命令自动变成只读。插件不添加另一套 shell 或文件访问实现。

当前禁用 DSH 官方及专家插件已知的网页搜索、抓取、图片与继续委派工具；第三方工具如使用不同名称，不属于已核对的对应关系。无需额外安装 Codex。

## 配置与报告

可选配置：

- `reviewModel`：同一模型提供方下的审查模型名称；省略时沿用当前模型。
- `reportDirectory`：报告目录，必须是绝对路径；默认 `$DSH_HOME/code-review`，未设置 DSH_HOME 时为 `~/.dsh/code-review`。

报告每个会话保留最近一份，原子替换保存。支持恢复早期版本报告；新运行不再保存代码快照、hash、额外证据或 side/limitations 扩展。宿主退出后不自动继续未完成审查。状态、取消和独立报告存储是 DSH 插件的兼容能力，不是 Codex 命令语法。

插件需官方 `spawn` provider、`userQuestions` 服务和当前平台的问题回答器；主模型需支持工具调用。没有回答器、模型失败、取消或空报告都会明确说明。

## 本地构建与安装

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
npm ci --ignore-scripts
npm run check
npm pack
dsh plugin --profile web add .\michengai-dsh-code-review-0.1.0.tgz --ignore-scripts
```

重启 DSH 后输入 `/review`。当前尚未发布 npm；已有本机测试包可重新安装以回退，回退不删除报告和会话。

## 验证与来源

`npm run check`：严格 TypeScript、短任务模板、原文哈希、真实 DSH AgentLoop 配合离线模型的工具调用、取消及报告恢复测试。`npm run verify:package`：隔离 DSH profile 验证 bundle、peer 和安装包宿主链路。离线夹具会通过注册的宿主工具执行真实 Git diff，但不替代在线模型或实际 Desktop/Web 验收。

- [任务模板](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/prompts/src/review_request.rs)
- [审查执行](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/core/src/tasks/review.rs)
- [范围选择](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/tui/src/chatwidget/review_popups.rs)
- [基准分支解析](https://github.com/openai/codex/blob/a592c38c16cdd7623dacc9168926ebccedfb67d3/codex-rs/git-utils/src/branch.rs)
- [原文](assets/codex/review/rubric.md)、[来源与哈希](assets/codex/review/source.json)、[NOTICE](NOTICE)、[LICENSE](LICENSE)

开发入口：[阅读导航](docs/00-交接入口/00-阅读导航.md)。
