import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-settings';

export type Locale = 'zh' | 'en';

/** 沿用专家插件的宿主语言入口；未保存偏好时后端无法获知浏览器语言。 */
export function readHostLocale(ctx: Context): Locale {
  const settings = ctx.get('settings');
  const section = settings?.get('locale') as { preference?: unknown } | undefined;
  return typeof section?.preference === 'string' && /^en(?:-|$)/i.test(section.preference) ? 'en' : 'zh';
}

const en = {
  '代码审查': 'Code review', '运行：': 'Run: ', '快照：': 'Snapshot: ', '基线：': 'Base: ', '目标：': 'Target: ',
  '无变更': 'No changes', '完成 · 零发现': 'Completed · No findings', '完成 · 有发现': 'Completed · Findings', '完成': 'Completed',
  '部分覆盖': 'Partial coverage', '失败': 'Failed', '中断': 'Interrupted', '输出无效': 'Invalid output', '快照过期': 'Stale snapshot',
  '审查未完成。': 'Review did not complete.', '审查完成。': 'Review completed.',
  '审查模式不提供网页、图片或继续委派能力。': 'Review mode does not provide web, image, or further delegation tools.',
  '会话没有有效 cwd。': 'The session has no valid cwd.',
  '需要独立上下文的原生 spawn provider。': 'A native spawn provider with an independent context is required.',
  '原生审查 Agent 未完成配置。': 'The native review Agent was not configured.',
  '原生子 Agent 未完成：': 'The native subagent did not complete: ',
  '审查 Agent 未返回报告。': 'The review Agent returned no report.', 'Agent 清理失败：': 'Agent cleanup failed: ',
  '未选择有效审查范围。': 'No valid review scope was selected.', '审查选择已取消或未填写。': 'Review selection was cancelled or left empty.',
  '选择审查范围': 'Select review scope', '对比基准分支': 'Review against a base branch',
  '从共同祖先审查当前分支的更改': 'Review changes on the current branch from the common ancestor',
  '审查未提交的更改': 'Review uncommitted changes', '审查暂存、未暂存及未跟踪的净更改': 'Review staged, unstaged, and untracked changes',
  '审查某次提交': 'Review a commit', '选择一个 Git 提交': 'Select a Git commit',
  '自定义审查要求': 'Custom review instructions', '输入本次需要检查的内容': 'Describe what to review',
  '请输入自定义审查要求': 'Enter custom review instructions', '当前会话没有工作目录。': 'The current session has no working directory.',
  '选择基准分支，也可输入其他分支或引用': 'Select a base branch, or enter another branch or ref',
  '选择提交，也可输入其他提交 SHA 或引用': 'Select a commit, or enter another commit SHA or ref',
  '取消当前代码审查': 'Cancel the current code review', '查看最近代码审查报告': 'Show the latest code review report',
  '已请求取消，等待审查清理完成。': 'Cancellation requested; waiting for review cleanup.', '没有正在运行的审查。': 'No review is running.',
  '审查或范围选择进行中。': 'Review or scope selection is in progress.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Review interrupted: a start record exists without a completed report. Please run it again.',
  '没有已保存的审查结果。': 'No saved review result.', '审查记录读取失败：': 'Failed to read the review record: ',
  '代码审查：选择范围或输入自定义要求': 'Code review: select a scope or enter custom instructions',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Submit empty to select a scope, or enter complete custom review instructions',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Review requested in the current session; a native subagent will perform it.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'A review is already running in this session. Wait or use /review-cancel.',
  '审查启动记录持久化失败：': 'Failed to persist the review start record: ', '；未调用子模型。': '; the review model was not called.',
  '报告持久化失败：': 'Failed to persist the report: ', '；不能确认重启后可恢复。': '; recovery after restart cannot be confirmed.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'The host has no session persistence backend; the structured report was saved separately.',
  '代码审查必须从当前会话调用。': 'Code review must be invoked from the current session.', 'input 必须是字符串。': 'input must be a string.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory must be an absolute path.', 'reviewModel 不能为空。': 'reviewModel must not be empty.',
  '（基线）': ' (base)', '证据：': 'Evidence: ', '未覆盖：': 'Not covered: ',
} as const;

export function translate(locale: Locale, key: keyof typeof en): string {
  return locale === 'en' ? en[key] : key;
}

/** 单独追加语言上下文，不改变 Codex rubric、任务原文或结构化输出协议。 */
export function outputLanguage(locale: Locale): string {
  return `Write user-facing review content in ${locale === 'en' ? 'English' : 'Simplified Chinese'}. This includes finding titles, bodies, the overall explanation, and plain-text reports. Preserve JSON keys, protocol enum values (including overall_correctness), priority labels, code, commands, and file paths unchanged.`;
}
