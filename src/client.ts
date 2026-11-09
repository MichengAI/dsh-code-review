import * as primitives from '@deepseek-ai/dsh-client-ui-primitives';
import { resolveHostLocale } from './i18n.js';

type Icon = (props: { size?: number }) => unknown;

/** 使用宿主提供的 Regular 图标。菜单自己传入 size。 */
function slashIcon(...names: string[]): Icon | undefined {
  const bag = primitives as Record<string, unknown>;
  for (const name of names) {
    const icon = bag[name];
    if (typeof icon === 'function') return icon as Icon;
  }
  return undefined;
}

type FaceText = { label: string; description: string; hint?: string };

/** Host `/` 行没有 icon/label；官方只给一等命令画脸。同名贡献会撞车，只能在每次候选项上覆盖文案。 */
const FACES = {
  review: {
    icon: slashIcon('IconChecklistOutlineRegular', 'IconChecklistOutline14'),
    zh: { label: '审查', description: '选择范围或输入自定义要求', hint: '留空提交以选择范围；或输入完整的自定义审查要求' },
    en: { label: 'Review', description: 'Select a scope or enter custom instructions', hint: 'Submit empty to select a scope, or enter complete custom review instructions' },
    ja: { label: 'レビュー', description: '範囲を選択するかカスタム指示を入力', hint: '空のまま送信して範囲を選択、または詳細なカスタムレビュー指示を入力' },
    es: { label: 'Revisión', description: 'Seleccione un alcance o ingrese instrucciones personalizadas', hint: 'Envíe vacío para seleccionar un alcance, o ingrese instrucciones completas' },
    fr: { label: 'Revue', description: 'Sélectionnez un périmètre ou entrez des instructions personnalisées', hint: 'Soumettez vide pour sélectionner un périmètre, ou entrez des instructions complètes' },
    de: { label: 'Review', description: 'Bereich auswählen oder benutzerdefinierte Anweisungen eingeben', hint: 'Leer absenden für Bereichsauswahl, oder vollständige Anweisungen eingeben' },
    ru: { label: 'Анализ', description: 'Выберите диапазон или введите пользовательские инструкции', hint: 'Отправьте пустым для выбора диапазона или введите полные инструкции' },
    pt: { label: 'Revisão', description: 'Selecione um escopo ou insira instruções personalizadas', hint: 'Envie vazio para selecionar um escopo ou insira instruções completas' },
  },
  'review-status': {
    icon: slashIcon('IconInfoOutlineRegular', 'IconInfoOutline14'),
    zh: { label: '审查状态', description: '查看最近代码审查报告' },
    en: { label: 'Review status', description: 'Show the latest code review report' },
    ja: { label: 'レビュー状態', description: '最近のコードレビューレポートを表示' },
    es: { label: 'Estado de revisión', description: 'Mostrar el informe de revisión más reciente' },
    fr: { label: 'État de la revue', description: 'Afficher le dernier rapport de revue' },
    de: { label: 'Review-Status', description: 'Neuesten Code-Review-Bericht anzeigen' },
    ru: { label: 'Статус анализа', description: 'Показать последний отчет об анализе кода' },
    pt: { label: 'Status da revisão', description: 'Mostrar o relatório de revisão mais recente' },
  },
  'review-cancel': {
    icon: slashIcon('IconCloseOutlineRegular', 'IconCloseOutline16'),
    zh: { label: '取消审查', description: '取消当前代码审查' },
    en: { label: 'Cancel review', description: 'Cancel the current code review' },
    ja: { label: 'レビュー中止', description: '現在のコードレビューをキャンセル' },
    es: { label: 'Cancelar revisión', description: 'Cancelar la revisión de código actual' },
    fr: { label: 'Annuler la revue', description: 'Annuler la revue de code actuelle' },
    de: { label: 'Review abbrechen', description: 'Aktuelles Code-Review abbrechen' },
    ru: { label: 'Отмена анализа', description: 'Отменить текущий анализ кода' },
    pt: { label: 'Cancelar revisão', description: 'Cancelar a revisão de código atual' },
  },
} as const;

type Lookup = { get?: (name: string) => unknown };

/** 按宿主 locale.snapshot.active 解析语言，未选择时默认中文，未知语言回退 en。 */
function resolveClientLocale(ctx: Lookup): string {
  const locale = ctx.get?.('locale') as { snapshot?: { active?: unknown } } | undefined;
  return resolveHostLocale(locale?.snapshot?.active);
}

function decorateSlashFaces(commandUi: unknown, ctx: Lookup): () => void {
  const live = commandUi as { candidates?: (...args: unknown[]) => unknown } | undefined;
  const original = live?.candidates;
  if (!live || typeof original !== 'function') return () => {};
  live.candidates = async (...args: unknown[]) => {
    const rows = await original.apply(live, args);
    if (!Array.isArray(rows)) return rows;
    const lang = resolveClientLocale(ctx);
    return rows.map((row: unknown) => {
      if (!row || typeof row !== 'object' || !('name' in row) || typeof (row as { name: unknown }).name !== 'string') return row;
      const item = row as { name: string; icon?: unknown; label?: unknown; description?: unknown; hint?: unknown };
      const face = FACES[item.name as keyof typeof FACES];
      if (!face) return item;
      const dict = face as Record<string, unknown>;
      const text = (dict[lang] ?? face.zh) as FaceText;
      return {
        ...item,
        ...(item.icon === undefined && face.icon !== undefined ? { icon: face.icon } : {}),
        label: text.label,
        description: text.description,
        ...('hint' in text && text.hint ? { hint: text.hint } : {}),
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
