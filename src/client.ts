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

/** Host `/` 行没有 icon/label；官方只给一等命令画脸。同名贡献会撞车，只能补 candidates。 */
const FACES = {
  review: { icon: slashIcon('IconChecklistOutlineRegular', 'IconChecklistOutline14'), zh: '审查', en: 'Review' },
  'review-status': { icon: slashIcon('IconInfoOutlineRegular', 'IconInfoOutline14'), zh: '审查状态', en: 'Review status' },
  'review-cancel': { icon: slashIcon('IconCloseOutlineRegular', 'IconCloseOutline16'), zh: '取消审查', en: 'Cancel review' },
} as const;

type Lookup = { get?: (name: string) => unknown };

function english(ctx: Lookup): boolean {
  const locale = ctx.get?.('locale') as { snapshot?: { active?: unknown } } | undefined;
  return typeof locale?.snapshot?.active === 'string' && /^en(?:-|$)/i.test(locale.snapshot.active);
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
      const item = row as { name: string; icon?: unknown; label?: unknown };
      const face = FACES[item.name as keyof typeof FACES];
      if (!face) return item;
      return {
        ...item,
        ...(item.icon === undefined && face.icon !== undefined ? { icon: face.icon } : {}),
        ...(item.label === undefined ? { label: en ? face.en : face.zh } : {}),
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
