import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-settings';

export type Locale = 'zh' | 'en' | 'ja' | 'es' | 'fr' | 'de' | 'ru' | 'pt';

function preferenceOf(section: unknown): unknown {
  return section && typeof section === 'object' ? (section as { preference?: unknown }).preference : undefined;
}

/** `0.2.0` 起语言在 profile 条目 `locale` 的表单值里，通过 `settings.describe()` 读取。 */
function readLocalePreference(settings: unknown): unknown {
  if (!settings || typeof settings !== 'object') return undefined;
  const api = settings as { describe?: () => unknown };
  if (typeof api.describe !== 'function') return undefined;
  try {
    const forms = api.describe();
    if (!Array.isArray(forms)) return undefined;
    const form = forms.find(item => item && typeof item === 'object' && (item as { ns?: unknown }).ns === 'locale') as { value?: unknown } | undefined;
    return preferenceOf(form?.value);
  } catch { return undefined; }
}

/** 将任意语言偏好收拢为 8 种官方支持语言；未指定/空偏好默认 zh，未知非支持语言（如 it-IT）回退 en 与宿主对齐。 */
export function resolveHostLocale(preference: unknown): Locale {
  if (typeof preference !== 'string' || !preference.trim()) return 'zh';
  const tag = preference.trim().toLowerCase();
  if (tag.startsWith('zh')) return 'zh';
  if (tag.startsWith('en')) return 'en';
  if (tag.startsWith('ja')) return 'ja';
  if (tag.startsWith('es')) return 'es';
  if (tag.startsWith('fr')) return 'fr';
  if (tag.startsWith('de')) return 'de';
  if (tag.startsWith('ru')) return 'ru';
  if (tag.startsWith('pt')) return 'pt';
  return 'en';
}

/** 沿用宿主 `locale.preference`；未保存偏好时后端无法获知浏览器语言。读取失败时保持中文，避免插件无法加载。 */
export function readHostLocale(ctx: Context): Locale {
  let settings: unknown;
  try { settings = ctx.get('settings'); } catch { settings = undefined; }
  const preference = readLocalePreference(settings);
  return resolveHostLocale(preference);
}

const en = {
  '代码审查': 'Code review', '运行：': 'Run: ', '快照：': 'Snapshot: ', '基线：': 'Base: ', '目标：': 'Target: ',
  '无变更': 'No changes', '完成 · 零发现': 'Completed · No findings', '完成 · 有发现': 'Completed · Findings', '完成': 'Completed',
  '部分覆盖': 'Partial coverage', '失败': 'Failed', '中断': 'Interrupted', '输出无效': 'Invalid output', '快照过期': 'Stale snapshot',
  '审查未完成。': 'Review did not complete.', '审查完成。': 'Review completed.',
  '会话没有有效 cwd。': 'The session has no valid cwd.',
  '需要独立上下文的原生 spawn provider。': 'A native spawn provider with an independent context is required.',
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
  '用户已取消操作。': 'Operation cancelled by user.',
  '父级任务已取消。': 'Cancelled by parent task.',
  '操作已中止。': 'Operation aborted.',
  '操作已中止': 'Operation aborted',
  '。': '.',
  '会话已销毁。': 'Session disposed.',
  '操作超时。': 'Operation timed out.',
  '选择范围或输入自定义要求': 'Select a scope or enter custom instructions',
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

export type MessageKey = keyof typeof en;

const ja: Record<MessageKey, string> = {
  '代码审查': 'コードレビュー', '运行：': '実行：', '快照：': 'スナップショット：', '基线：': 'ベース：', '目标：': 'ターゲット：',
  '无变更': '変更なし', '完成 · 零发现': '完了 · 指摘なし', '完成 · 有发现': '完了 · 指摘あり', '完成': '完了',
  '部分覆盖': '一部カバー', '失败': '失敗', '中断': '中断', '输出无效': '無効な出力', '快照过期': 'スナップショット期限切れ',
  '审查未完成。': 'レビューは完了しませんでした。', '审查完成。': 'レビューが完了しました。',
  '会话没有有效 cwd。': 'セッションに有効な cwd がありません。',
  '需要独立上下文的原生 spawn provider。': '独立したコンテキストを持つネイティブ spawn プロバイダーが必要です。',
  '原生子 Agent 未完成：': 'ネイティブサブ Agent が完了しませんでした：',
  '审查 Agent 未返回报告。': 'レビュー Agent からレポートが返されませんでした。', 'Agent 清理失败：': 'Agent のクリーンアップに失敗しました：',
  '未选择有效审查范围。': '有効なレビュー範囲が選択されていません。', '审查选择已取消或未填写。': 'レビューの選択がキャンセルされたか、未入力です。',
  '选择审查范围': 'レビュー範囲を選択', '对比基准分支': 'ベースブランチと比較',
  '从共同祖先审查当前分支的更改': '共通の祖先から現在のブランチの変更をレビュー',
  '审查未提交的更改': '未コミットの変更をレビュー', '审查暂存、未暂存及未跟踪的净更改': 'ステージング、未ステージング、未追跡の変更をレビュー',
  '审查某次提交': '特定のコミットをレビュー', '选择一个 Git 提交': 'Git コミットを選択',
  '自定义审查要求': 'カスタムレビュー指示', '输入本次需要检查的内容': '今回確認したい内容を入力',
  '请输入自定义审查要求': 'カスタムレビュー指示を入力してください', '当前会话没有工作目录。': '現在のセッションに作業ディレクトリがありません。',
  '选择基准分支，也可输入其他分支或引用': 'ベースブランチを選択するか、他のブランチまたは参照を入力',
  '选择提交，也可输入其他提交 SHA 或引用': 'コミットを選択するか、他のコミット SHA または参照を入力',
  '取消当前代码审查': '現在のコードレビューをキャンセル', '查看最近代码审查报告': '最近のコードレビューレポートを表示',
  '已请求取消，等待审查清理完成。': 'キャンセルを要求しました。クリーンアップの完了を待っています。', '没有正在运行的审查。': '実行中のレビューはありません。',
  '审查或范围选择进行中。': 'レビューまたは範囲選択が進行中です。',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'レビューが中断されました：開始記録は存在しますが完了レポートがありません。再実行してください。',
  '没有已保存的审查结果。': '保存されたレビュー結果はありません。', '审查记录读取失败：': 'レビュー記録の読み取りに失敗しました：',
  '用户已取消操作。': 'ユーザーによって操作がキャンセルされました。',
  '父级任务已取消。': '親タスクによってキャンセルされました。',
  '操作已中止。': '操作が中止されました。',
  '操作已中止': '操作が中止されました',
  '。': '。',
  '会话已销毁。': 'セッションが破棄されました。',
  '操作超时。': '操作がタイムアウトしました。',
  '选择范围或输入自定义要求': '範囲を選択するかカスタム指示を入力',
  '留空提交以选择范围；或输入完整的自定义审查要求': '空のまま送信して範囲を選択、または詳細なカスタムレビュー指示を入力',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'レビュー要求が送信されました。ネイティブサブ Agent が実行します。',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'このセッションでは既にレビューが実行中です。完了を待つか /review-cancel してください。',
  '审查启动记录持久化失败：': 'レビュー開始記録の保存に失敗しました：', '；未调用子模型。': '；サブモデルは呼び出されていません。',
  '报告持久化失败：': 'レポートの保存に失敗しました：', '；不能确认重启后可恢复。': '；再起動後の回復は保証されません。',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'ホストにセッション永続化バックエンドが設定されていません。構造化レポートは個別に保存されました。',
  '代码审查必须从当前会话调用。': 'コードレビューは現在のセッションから呼び出す必要があります。', 'input 必须是字符串。': 'input は文字列である必要があります。',
  'reportDirectory 必须为绝对路径。': 'reportDirectory は絶対パスである必要があります。', 'reviewModel 不能为空。': 'reviewModel を空にすることはできません。',
  '（基线）': '（ベース）', '证据：': '証拠：', '未覆盖：': '未カバー：',
};

const es: Record<MessageKey, string> = {
  '代码审查': 'Revisión de código', '运行：': 'Ejecución: ', '快照：': 'Instantánea: ', '基线：': 'Base: ', '目标：': 'Destino: ',
  '无变更': 'Sin cambios', '完成 · 零发现': 'Completado · Sin hallazgos', '完成 · 有发现': 'Completado · Con hallazgos', '完成': 'Completado',
  '部分覆盖': 'Cobertura parcial', '失败': 'Fallido', '中断': 'Interrumpido', '输出无效': 'Salida no válida', '快照过期': 'Instantánea obsoleta',
  '审查未完成。': 'La revisión no se completó.', '审查完成。': 'Revisión completada.',
  '会话没有有效 cwd。': 'La sesión no tiene un cwd válido.',
  '需要独立上下文的原生 spawn provider。': 'Se requiere un proveedor de spawn nativo con contexto independiente.',
  '原生子 Agent 未完成：': 'El subagente nativo no se completó: ',
  '审查 Agent 未返回报告。': 'El agente de revisión no devolvió ningún informe.', 'Agent 清理失败：': 'Error al limpiar el agente: ',
  '未选择有效审查范围。': 'No se seleccionó un alcance de revisión válido.', '审查选择已取消或未填写。': 'La selección de revisión se canceló o se dejó vacía.',
  '选择审查范围': 'Seleccionar alcance de la revisión', '对比基准分支': 'Comparar con rama base',
  '从共同祖先审查当前分支的更改': 'Revisar cambios en la rama actual desde el ancestro común',
  '审查未提交的更改': 'Revisar cambios no confirmados', '审查暂存、未暂存及未跟踪的净更改': 'Revisar cambios preparados, no preparados y sin seguimiento',
  '审查某次提交': 'Revisar una confirmación', '选择一个 Git 提交': 'Seleccionar un commit de Git',
  '自定义审查要求': 'Instrucciones personalizadas de revisión', '输入本次需要检查的内容': 'Describa lo que desea revisar',
  '请输入自定义审查要求': 'Ingrese las instrucciones personalizadas de revisión', '当前会话没有工作目录。': 'La sesión actual no tiene directorio de trabajo.',
  '选择基准分支，也可输入其他分支或引用': 'Seleccione una rama base o ingrese otra rama o referencia',
  '选择提交，也可输入其他提交 SHA 或引用': 'Seleccione un commit o ingrese otro SHA o referencia',
  '取消当前代码审查': 'Cancelar la revisión de código actual', '查看最近代码审查报告': 'Mostrar el informe de revisión más reciente',
  '已请求取消，等待审查清理完成。': 'Cancelación solicitada; esperando limpieza de la revisión.', '没有正在运行的审查。': 'No hay ninguna revisión en ejecución.',
  '审查或范围选择进行中。': 'Revisión o selección de alcance en curso.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Revisión interrumpida: existe un registro de inicio sin informe completo. Vuelva a ejecutarla.',
  '没有已保存的审查结果。': 'No hay resultados de revisión guardados.', '审查记录读取失败：': 'Error al leer el registro de revisión: ',
  '用户已取消操作。': 'Operación cancelada por el usuario.',
  '父级任务已取消。': 'Cancelado por la tarea principal.',
  '操作已中止。': 'Operación abortada.',
  '操作已中止': 'Operación abortada',
  '。': '.',
  '会话已销毁。': 'Sesión destruida.',
  '操作超时。': 'Operación agotada.',
  '选择范围或输入自定义要求': 'Seleccione un alcance o ingrese instrucciones personalizadas',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Envíe vacío para seleccionar un alcance, o ingrese instrucciones detalladas',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Solicitud de revisión enviada; un subagente nativo la ejecutará.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'Ya hay una revisión en curso en esta sesión. Espere o use /review-cancel.',
  '审查启动记录持久化失败：': 'Error al guardar el registro de inicio de la revisión: ', '；未调用子模型。': '; no se llamó al modelo secundario.',
  '报告持久化失败：': 'Error al guardar el informe: ', '；不能确认重启后可恢复。': '; no se puede confirmar la recuperación tras reiniciar.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'El host no configuró persistencia de sesión; el informe se guardó de forma independiente.',
  '代码审查必须从当前会话调用。': 'La revisión de código debe invocarse desde la sesión actual.', 'input 必须是字符串。': 'input debe ser una cadena.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory debe ser una ruta absoluta.', 'reviewModel 不能为空。': 'reviewModel no puede estar vacío.',
  '（基线）': ' (base)', '证据：': 'Evidencia: ', '未覆盖：': 'No cubierto: ',
};

const fr: Record<MessageKey, string> = {
  '代码审查': 'Revue de code', '运行：': 'Exécution : ', '快照：': 'Instantané : ', '基线：': 'Base : ', '目标：': 'Cible : ',
  '无变更': 'Aucun changement', '完成 · 零发现': 'Terminé · Aucun problème', '完成 · 有发现': 'Terminé · Problèmes détectés', '完成': 'Terminé',
  '部分覆盖': 'Couverture partielle', '失败': 'Échec', '中断': 'Interrompu', '输出无效': 'Sortie invalide', '快照过期': 'Instantané périmé',
  '审查未完成。': 'La revue ne s\'est pas terminée.', '审查完成。': 'Revue terminée.',
  '会话没有有效 cwd。': 'La session n\'a pas de cwd valide.',
  '需要独立上下文的原生 spawn provider。': 'Un fournisseur spawn natif avec un contexte indépendant est requis.',
  '原生子 Agent 未完成：': 'Le sous-agent natif ne s\'est pas terminé : ',
  '审查 Agent 未返回报告。': 'L\'agent de revue n\'a retourné aucun rapport.', 'Agent 清理失败：': 'Échec du nettoyage de l\'agent : ',
  '未选择有效审查范围。': 'Aucun périmètre de revue valide sélectionné.', '审查选择已取消或未填写。': 'La sélection de revue a été annulée ou laissée vide.',
  '选择审查范围': 'Sélectionner le périmètre de la revue', '对比基准分支': 'Comparer à la branche de base',
  '从共同祖先审查当前分支的更改': 'Examiner les modifications de la branche actuelle depuis l\'ancêtre commun',
  '审查未提交的更改': 'Examiner les modifications non validées', '审查暂存、未暂存及未跟踪的净更改': 'Examiner les modifications indexées, non indexées et non suivies',
  '审查某次提交': 'Examiner un commit', '选择一个 Git 提交': 'Sélectionner un commit Git',
  '自定义审查要求': 'Instructions personnalisées de revue', '输入本次需要检查的内容': 'Décrivez ce qu\'il faut examiner',
  '请输入自定义审查要求': 'Entrez les instructions personnalisées de revue', '当前会话没有工作目录。': 'La session actuelle n\'a pas de répertoire de travail.',
  '选择基准分支，也可输入其他分支或引用': 'Sélectionnez une branche de base ou entrez une autre branche ou référence',
  '选择提交，也可输入其他提交 SHA 或引用': 'Sélectionnez un commit ou entrez un autre SHA ou référence',
  '取消当前代码审查': 'Annuler la revue de code actuelle', '查看最近代码审查报告': 'Afficher le dernier rapport de revue',
  '已请求取消，等待审查清理完成。': 'Annulation demandée ; en attente du nettoyage de la revue.', '没有正在运行的审查。': 'Aucune revue en cours.',
  '审查或范围选择进行中。': 'Revue ou sélection du périmètre en cours.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Revue interrompue : un enregistrement de début existe sans rapport terminé. Veuillez relancer.',
  '没有已保存的审查结果。': 'Aucun résultat de revue enregistré.', '审查记录读取失败：': 'Échec de la lecture de l\'enregistrement de revue : ',
  '用户已取消操作。': 'Opération annulée par l\'utilisateur.',
  '父级任务已取消。': 'Annulé par la tâche parente.',
  '操作已中止。': 'Opération interrompue.',
  '操作已中止': 'Opération interrompue',
  '。': '.',
  '会话已销毁。': 'Session détruite.',
  '操作超时。': 'Délai d\'opération dépassé.',
  '选择范围或输入自定义要求': 'Sélectionnez un périmètre ou entrez des instructions personnalisées',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Soumettez vide pour sélectionner un périmètre, ou entrez des instructions complètes',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Demande de revue soumise ; un sous-agent natif va l\'exécuter.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'Une revue est déjà en cours dans cette session. Attendez ou utilisez /review-cancel.',
  '审查启动记录持久化失败：': 'Échec de l\'enregistrement du début de revue : ', '；未调用子模型。': ' ; le sous-modèle n\'a pas été appelé.',
  '报告持久化失败：': 'Échec de l\'enregistrement du rapport : ', '；不能确认重启后可恢复。': ' ; la récupération après redémarrage ne peut être confirmée.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'L\'hôte n\'a pas de backend de persistance ; le rapport a été enregistré séparément.',
  '代码审查必须从当前会话调用。': 'La revue de code doit être appelée depuis la session actuelle.', 'input 必须是字符串。': 'input doit être une chaîne.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory doit être un chemin absolu.', 'reviewModel 不能为空。': 'reviewModel ne peut pas être vide.',
  '（基线）': ' (base)', '证据：': 'Preuve : ', '未覆盖：': 'Non couvert : ',
};

const de: Record<MessageKey, string> = {
  '代码审查': 'Code-Review', '运行：': 'Ausführung: ', '快照：': 'Snapshot: ', '基线：': 'Basis: ', '目标：': 'Ziel: ',
  '无变更': 'Keine Änderungen', '完成 · 零发现': 'Abgeschlossen · Keine Auffälligkeiten', '完成 · 有发现': 'Abgeschlossen · Auffälligkeiten gefunden', '完成': 'Abgeschlossen',
  '部分覆盖': 'Teilweise Abdeckung', '失败': 'Fehlgeschlagen', '中断': 'Unterbrochen', '输出无效': 'Ungültige Ausgabe', '快照过期': 'Veralteter Snapshot',
  '审查未完成。': 'Review wurde nicht abgeschlossen.', '审查完成。': 'Review abgeschlossen.',
  '会话没有有效 cwd。': 'Die Sitzung hat kein gültiges cwd.',
  '需要独立上下文的原生 spawn provider。': 'Ein nativer spawn-Provider mit unabhängigem Kontext ist erforderlich.',
  '原生子 Agent 未完成：': 'Der native Sub-Agent wurde nicht abgeschlossen: ',
  '审查 Agent 未返回报告。': 'Der Review-Agent hat keinen Bericht zurückgegeben.', 'Agent 清理失败：': 'Agent-Bereinigung fehlgeschlagen: ',
  '未选择有效审查范围。': 'Kein gültiger Review-Bereich ausgewählt.', '审查选择已取消或未填写。': 'Review-Auswahl abgebrochen oder leer gelassen.',
  '选择审查范围': 'Review-Bereich auswählen', '对比基准分支': 'Mit Basis-Branch vergleichen',
  '从共同祖先审查当前分支的更改': 'Änderungen auf dem aktuellen Branch ab dem gemeinsamen Vorfahren überprüfen',
  '审查未提交的更改': 'Nicht committete Änderungen überprüfen', '审查暂存、未暂存及未跟踪的净更改': 'Gestagte, ungestagte und nicht verfolgte Änderungen überprüfen',
  '审查某次提交': 'Einen Commit überprüfen', '选择一个 Git 提交': 'Einen Git-Commit auswählen',
  '自定义审查要求': 'Benutzerdefinierte Review-Anweisungen', '输入本次需要检查的内容': 'Beschreiben Sie, was überprüft werden soll',
  '请输入自定义审查要求': 'Geben Sie benutzerdefinierte Review-Anweisungen ein', '当前会话没有工作目录。': 'Die aktuelle Sitzung hat kein Arbeitsverzeichnis.',
  '选择基准分支，也可输入其他分支或引用': 'Basis-Branch auswählen oder einen anderen Branch/Ref eingeben',
  '选择提交，也可输入其他提交 SHA 或引用': 'Commit auswählen oder einen anderen Commit-SHA/Ref eingeben',
  '取消当前代码审查': 'Aktuelles Code-Review abbrechen', '查看最近代码审查报告': 'Neuesten Code-Review-Bericht anzeigen',
  '已请求取消，等待审查清理完成。': 'Abbruch angefordert; warte auf Bereinigung.', '没有正在运行的审查。': 'Kein Review wird ausgeführt.',
  '审查或范围选择进行中。': 'Review oder Bereichsauswahl läuft.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Review unterbrochen: Startaufzeichnung vorhanden, aber kein vollständiger Bericht. Bitte erneut ausführen.',
  '没有已保存的审查结果。': 'Kein gespeichertes Review-Ergebnis vorhanden.', '审查记录读取失败：': 'Fehler beim Lesen des Review-Datensatzes: ',
  '用户已取消操作。': 'Vorgang durch Benutzer abgebrochen.',
  '父级任务已取消。': 'Von übergeordneter Aufgabe abgebrochen.',
  '操作已中止。': 'Vorgang abgebrochen.',
  '操作已中止': 'Vorgang abgebrochen',
  '。': '.',
  '会话已销毁。': 'Sitzung verworfen.',
  '操作超时。': 'Zeitüberschreitung des Vorgangs.',
  '选择范围或输入自定义要求': 'Bereich auswählen oder benutzerdefinierte Anweisungen eingeben',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Leer absenden für Bereichsauswahl, oder vollständige Anweisungen eingeben',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Review-Anforderung übermittelt; wird von nativem Sub-Agent ausgeführt.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'In dieser Sitzung läuft bereits ein Review. Bitte warten oder /review-cancel nutzen.',
  '审查启动记录持久化失败：': 'Fehler beim Speichern des Review-Startdatensatzes: ', '；未调用子模型。': '; das Sub-Modell wurde nicht aufgerufen.',
  '报告持久化失败：': 'Fehler beim Speichern des Berichts: ', '；不能确认重启后可恢复。': '; Wiederherstellung nach Neustart kann nicht garantiert werden.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'Host hat kein Persistenz-Backend konfiguriert; strukturierter Bericht wurde separat gespeichert.',
  '代码审查必须从当前会话调用。': 'Code-Review muss aus der aktuellen Sitzung aufgerufen werden.', 'input 必须是字符串。': 'input muss ein String sein.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory muss ein absoluter Pfad sein.', 'reviewModel 不能为空。': 'reviewModel darf nicht leer sein.',
  '（基线）': ' (Basis)', '证据：': 'Beweis: ', '未覆盖：': 'Nicht abgedeckt: ',
};

const ru: Record<MessageKey, string> = {
  '代码审查': 'Анализ кода', '运行：': 'Запуск: ', '快照：': 'Снимок: ', '基线：': 'База: ', '目标：': 'Цель: ',
  '无变更': 'Нет изменений', '完成 · 零发现': 'Завершено · Замечаний нет', '完成 · 有发现': 'Завершено · Есть замечания', '完成': 'Завершено',
  '部分覆盖': 'Частичное покрытие', '失败': 'Сбой', '中断': 'Прервано', '输出无效': 'Недопустимый вывод', '快照过期': 'Устаревший снимок',
  '审查未完成。': 'Анализ не был завершен.', '审查完成。': 'Анализ завершен.',
  '会话没有有效 cwd。': 'У сессии нет действительного cwd.',
  '需要独立上下文的原生 spawn provider。': 'Требуется нативный провайдер spawn с независимым контекстом.',
  '原生子 Agent 未完成：': 'Нативный субагент не завершил работу: ',
  '审查 Agent 未返回报告。': 'Агент анализа не вернул отчет.', 'Agent 清理失败：': 'Сбой очистки агента: ',
  '未选择有效审查范围。': 'Не выбран допустимый диапазон анализа.', '审查选择已取消或未填写。': 'Выбор анализа отменен или оставлен пустым.',
  '选择审查范围': 'Выберите диапазон анализа', '对比基准分支': 'Сравнить с базовой веткой',
  '从共同祖先审查当前分支的更改': 'Проверить изменения в текущей ветке от общего предка',
  '审查未提交的更改': 'Проверить незакоммиченные изменения', '审查暂存、未暂存及未跟踪的净更改': 'Проверить индексированные, неиндексированные и неотслеживаемые изменения',
  '审查某次提交': 'Проверить конкретный коммит', '选择一个 Git 提交': 'Выберите коммит Git',
  '自定义审查要求': 'Пользовательские инструкции анализа', '输入本次需要检查的内容': 'Опишите, что необходимо проверить',
  '请输入自定义审查要求': 'Введите пользовательские инструкции анализа', '当前会话没有工作目录。': 'У текущей сессии нет рабочего каталога.',
  '选择基准分支，也可输入其他分支或引用': 'Выберите базовую ветку или введите другую ветку/ссылку',
  '选择提交，也可输入其他提交 SHA 或引用': 'Выберите коммит или введите другой SHA коммита/ссылку',
  '取消当前代码审查': 'Отменить текущий анализ кода', '查看最近代码审查报告': 'Показать последний отчет об анализе кода',
  '已请求取消，等待审查清理完成。': 'Запрос на отмену отправлен; ожидание очистки анализа.', '没有正在运行的审查。': 'Нет выполняемых анализов.',
  '审查或范围选择进行中。': 'Выполняется анализ или выбор диапазона.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Анализ прерван: есть запись о запуске, но нет отчета. Пожалуйста, запустите снова.',
  '没有已保存的审查结果。': 'Нет сохраненных результатов анализа.', '审查记录读取失败：': 'Не удалось прочитать запись анализа: ',
  '用户已取消操作。': 'Операция отменена пользователем.',
  '父级任务已取消。': 'Отменено родительской задачей.',
  '操作已中止。': 'Операция прервана.',
  '操作已中止': 'Операция прервана',
  '。': '.',
  '会话已销毁。': 'Сессия уничтожена.',
  '操作超时。': 'Время ожидания операции истекло.',
  '选择范围或输入自定义要求': 'Выберите диапазон или введите пользовательские инструкции',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Отправьте пустым для выбора диапазона или введите полные инструкции',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Запрос на анализ отправлен; нативный субагент выполнит его.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'В этой сессии уже выполняется анализ. Подождите или используйте /review-cancel.',
  '审查启动记录持久化失败：': 'Не удалось сохранить запись о запуске анализа: ', '；未调用子模型。': '; субмодель не вызывалась.',
  '报告持久化失败：': 'Не удалось сохранить отчет: ', '；不能确认重启后可恢复。': '; восстановление после перезапуска не гарантируется.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'Хост не настроил персистентность сессий; структурированный отчет сохранен отдельно.',
  '代码审查必须从当前会话调用。': 'Анализ кода должен вызываться из текущей сессии.', 'input 必须是字符串。': 'input должен быть строкой.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory должен быть абсолютным путем.', 'reviewModel 不能为空。': 'reviewModel не может быть пустым.',
  '（基线）': ' (база)', '证据：': 'Свидетельство: ', '未覆盖：': 'Не охвачено: ',
};

const pt: Record<MessageKey, string> = {
  '代码审查': 'Revisão de código', '运行：': 'Execução: ', '快照：': 'Instantâneo: ', '基线：': 'Base: ', '目标：': 'Destino: ',
  '无变更': 'Sem alterações', '完成 · 零发现': 'Concluído · Nenhum apontamento', '完成 · 有发现': 'Concluído · Com apontamentos', '完成': 'Concluído',
  '部分覆盖': 'Cobertura parcial', '失败': 'Falhou', '中断': 'Interrompido', '输出无效': 'Saída inválida', '快照过期': 'Instantâneo obsoleto',
  '审查未完成。': 'A revisão não foi concluída.', '审查完成。': 'Revisão concluída.',
  '会话没有有效 cwd。': 'A sessão não possui um cwd válido.',
  '需要独立上下文的原生 spawn provider。': 'É necessário um provedor spawn nativo com contexto independente.',
  '原生子 Agent 未完成：': 'O subagente nativo não foi concluído: ',
  '审查 Agent 未返回报告。': 'O agente de revisão não retornou nenhum relatório.', 'Agent 清理失败：': 'Falha na limpeza do agente: ',
  '未选择有效审查范围。': 'Nenhum escopo de revisão válido foi selecionado.', '审查选择已取消或未填写。': 'A seleção de revisão foi cancelada ou deixada em branco.',
  '选择审查范围': 'Selecionar escopo da revisão', '对比基准分支': 'Comparar com branch base',
  '从共同祖先审查当前分支的更改': 'Revisar alterações na branch atual a partir do ancestral comum',
  '审查未提交的更改': 'Revisar alterações não confirmadas', '审查暂存、未暂存及未跟踪的净更改': 'Revisar alterações preparadas, não preparadas e não rastreadas',
  '审查某次提交': 'Revisar um commit', '选择一个 Git 提交': 'Selecionar um commit do Git',
  '自定义审查要求': 'Instruções personalizadas de revisão', '输入本次需要检查的内容': 'Descreva o que deseja revisar',
  '请输入自定义审查要求': 'Insira as instruções personalizadas de revisão', '当前会话没有工作目录。': 'A sessão atual não possui diretório de trabalho.',
  '选择基准分支，也可输入其他分支或引用': 'Selecione uma branch base ou insira outra branch ou referência',
  '选择提交，也可输入其他提交 SHA 或引用': 'Selecione um commit ou insira outro SHA de commit ou referência',
  '取消当前代码审查': 'Cancelar a revisão de código atual', '查看最近代码审查报告': 'Mostrar o relatório de revisão mais recente',
  '已请求取消，等待审查清理完成。': 'Cancelamento solicitado; aguardando limpeza da revisão.', '没有正在运行的审查。': 'Nenhuma revisão em execução.',
  '审查或范围选择进行中。': 'Revisão ou seleção de escopo em andamento.',
  '审查中断：存在启动记录但没有完成报告，请重新运行。': 'Revisão interrompida: existe um registro de início sem relatório completo. Execute novamente.',
  '没有已保存的审查结果。': 'Nenhum resultado de revisão salvo.', '审查记录读取失败：': 'Falha ao ler o registro de revisão: ',
  '用户已取消操作。': 'Operação cancelada pelo usuário.',
  '父级任务已取消。': 'Cancelado pela tarefa pai.',
  '操作已中止。': 'Operação abortada.',
  '操作已中止': 'Operação abortada',
  '。': '.',
  '会话已销毁。': 'Sessão descartada.',
  '操作超时。': 'Operação expirou.',
  '选择范围或输入自定义要求': 'Selecione um escopo ou insira instruções personalizadas',
  '留空提交以选择范围；或输入完整的自定义审查要求': 'Envie vazio para selecionar um escopo ou insira instruções completas',
  '已将审查请求提交到当前会话，将通过原生子 Agent 执行。': 'Solicitação de revisão enviada; um subagente nativo a executará.',
  '当前会话已有审查运行，请等待或 /review-cancel。': 'Já há uma revisão em execução nesta sessão. Aguarde ou use /review-cancel.',
  '审查启动记录持久化失败：': 'Falha ao salvar o registro de início da revisão: ', '；未调用子模型。': '; o submodelo não foi chamado.',
  '报告持久化失败：': 'Falha ao salvar o relatório: ', '；不能确认重启后可恢复。': '; a recuperação após reinicialização não pode ser confirmada.',
  '宿主未配置会话持久化后端；结构化报告已独立保存。': 'O host não configurou persistência de sessão; o relatório estruturado foi salvo separadamente.',
  '代码审查必须从当前会话调用。': 'A revisão de código deve ser invocada a partir da sessão atual.', 'input 必须是字符串。': 'input deve ser uma string.',
  'reportDirectory 必须为绝对路径。': 'reportDirectory deve ser um caminho absoluto.', 'reviewModel 不能为空。': 'reviewModel não pode estar vazio.',
  '（基线）': ' (base)', '证据：': 'Evidência: ', '未覆盖：': 'Não coberto: ',
};

const DICTIONARIES: Record<Exclude<Locale, 'zh'>, Record<MessageKey, string>> = {
  en, ja, es, fr, de, ru, pt,
};

export function translate(locale: Locale, key: MessageKey): string {
  if (locale === 'zh') return key;
  return DICTIONARIES[locale]?.[key] ?? key;
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  zh: 'Simplified Chinese',
  en: 'English',
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ru: 'Russian',
  pt: 'Portuguese',
};

/** 审查标准沿用 Codex rubric。会话里写给人看的报告，不输出 JSON。 */
export function outputLanguage(locale: Locale): string {
  const language = LANGUAGE_NAMES[locale] ?? 'Simplified Chinese';
  return `Write user-facing review content in ${language} as GitHub Flavored Markdown. The guidelines above decide which issues qualify, but ignore their JSON output schema.
This review runs in DeepSeek Harness, which renders that Markdown in the session. Reply with the review itself: one to three sentences for the overall verdict, then each finding as a level-3 heading, a Markdown file link, and one paragraph. Start a heading with [P0] through [P3] when you assign a priority. Write a known location as [path:start–end](path#Lstart) or [path:start–end](path#Lstart-Lend).
Do not output JSON, markdown fences, or field names such as findings, overall_correctness, overall_explanation, or code_location.
If there are no findings, say so. Follow the host's delegated permission scope. If a required operation is denied or unavailable, report the limitation and finish with the evidence you could obtain. For a change review, distinguish inspecting the diff from reading the current files; if the diff could not be inspected, do not claim the patch is correct. If tests could not run, say so.`;
}
