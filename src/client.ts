import * as primitives from '@deepseek-ai/dsh-client-ui-primitives';

type Icon = (props: { size?: number }) => unknown;

/** 0.1.7 用 Regular；0.1.6 仍导出带尺寸的旧名。菜单自己传入 size。 */
function slashIcon(...names: string[]): Icon | undefined {
  const bag = primitives as Record<string, unknown>;
  for (const name of names) {
    const icon = bag[name];
    if (typeof icon === 'function') return icon as Icon;
  }
  return undefined;
}

/** Host `/` 行没有 icon/label；官方只给一等命令画脸。同名贡献会撞车，只能在每次候选项上覆盖文案。 */
const FACES = {
  review: {
    icon: slashIcon('IconChecklistOutlineRegular', 'IconChecklistOutline14'),
    zh: { label: '审查', description: '选择范围或输入自定义要求', hint: '留空提交以选择范围；或输入完整的自定义审查要求' },
    en: { label: 'Review', description: 'Select a scope or enter custom instructions', hint: 'Submit empty to select a scope, or enter complete custom review instructions' },
  },
  'review-status': {
    icon: slashIcon('IconInfoOutlineRegular', 'IconInfoOutline14'),
    zh: { label: '审查状态', description: '查看最近代码审查报告' },
    en: { label: 'Review status', description: 'Show the latest code review report' },
  },
  'review-cancel': {
    icon: slashIcon('IconCloseOutlineRegular', 'IconCloseOutline16'),
    zh: { label: '取消审查', description: '取消当前代码审查' },
    en: { label: 'Cancel review', description: 'Cancel the current code review' },
  },
} as const;

type Lookup = { get?: (name: string) => unknown };

/** `en`、`en-US` 与 `en_US` 都算英文；其余保持中文。每次候选都重读，不随语言切换重注册命令。 */
function english(ctx: Lookup): boolean {
  const locale = ctx.get?.('locale') as { snapshot?: { active?: unknown } } | undefined;
  return typeof locale?.snapshot?.active === 'string' && /^en(?:[-_]|$)/i.test(locale.snapshot.active);
}

function decorateSlashFaces(commandUi: unknown, ctx: Lookup): () => void {
  const live = commandUi as { candidates?: (...args: unknown[]) => unknown } | undefined;
  const original = live?.candidates;
  if (!live || typeof original !== 'function') return () => {};
  live.candidates = async (...args: unknown[]) => {
    const rows = await original.apply(live, args);
    if (!Array.isArray(rows)) return rows;
    const en = english(ctx);
    return rows.map((row: unknown) => {
      if (!row || typeof row !== 'object' || !('name' in row) || typeof (row as { name: unknown }).name !== 'string') return row;
      const item = row as { name: string; icon?: unknown; label?: unknown; description?: unknown; hint?: unknown };
      const face = FACES[item.name as keyof typeof FACES];
      if (!face) return item;
      const text = en ? face.en : face.zh;
      return {
        ...item,
        ...(item.icon === undefined && face.icon !== undefined ? { icon: face.icon } : {}),
        label: text.label,
        description: text.description,
        ...('hint' in text ? { hint: text.hint } : {}),
      };
    });
  };
  return () => { live.candidates = original; };
}

export function apply(ctx: { inject?: (deps: string[], callback: (scope: Lookup) => () => void) => unknown; effect?: (callback: () => () => void) => unknown; get?: (name: string) => unknown }): () => void {
  if (typeof ctx.inject === 'function') {
    const dispose = ctx.inject(['commandUi'], scope => decorateSlashFaces(scope.get?.('commandUi'), scope));
    return typeof dispose === 'function' ? dispose : () => {};
  }
  if (typeof ctx.effect === 'function') {
    const dispose = ctx.effect(() => decorateSlashFaces(ctx.get?.('commandUi'), ctx));
    return typeof dispose === 'function' ? dispose : () => {};
  }
  return decorateSlashFaces(ctx.get?.('commandUi'), ctx);
}
