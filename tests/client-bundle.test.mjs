import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const reviewIcon = () => null;
const statusIcon = () => null;
const cancelIcon = () => null;

function loadClient(icons = {
  IconChecklistOutline14: reviewIcon,
  IconInfoOutline14: statusIcon,
  IconCloseOutline16: cancelIcon,
}) {
  let contribution;
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: value => { contribution = value; } } },
  });
  assert.equal(contribution.id, '@michengai/dsh-code-review');
  const client = contribution.factory(name => {
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return icons;
    throw new Error(`unexpected client require: ${name}`);
  });
  return client;
}

test('斜杠菜单为审查命令补官方图标和中文标题，不覆盖已有图标', async () => {
  const client = loadClient();
  const keep = () => null;
  const commandUi = {
    candidates: async () => ([
      { name: 'compact', description: '压缩', icon: keep },
      { name: 'review', description: '代码审查：选择范围或输入自定义要求', hint: '旧提示', label: '旧标题' },
      { name: 'review-status', description: '目录里的状态说明' },
      { name: 'review-cancel', description: '目录里的取消说明' },
      { name: 'other', description: '其他' },
    ]),
  };
  const dispose = client.apply({
    get: () => ({}),
    inject: (_deps, callback) => callback({ get: name => name === 'commandUi' ? commandUi : undefined }),
  });
  const rows = await commandUi.candidates();
  assert.equal(rows[0].icon, keep);
  assert.equal(rows[0].description, '压缩');
  assert.equal(rows[0].label, undefined);
  assert.equal(rows[1].icon, reviewIcon);
  assert.equal(rows[1].label, '审查');
  assert.equal(rows[1].description, '选择范围或输入自定义要求');
  assert.equal(rows[1].hint, '留空提交以选择范围；或输入完整的自定义审查要求');
  assert.equal(rows[2].icon, statusIcon);
  assert.equal(rows[2].label, '审查状态');
  assert.equal(rows[2].description, '查看最近代码审查报告');
  assert.equal(rows[2].hint, undefined);
  assert.equal(rows[3].icon, cancelIcon);
  assert.equal(rows[3].label, '取消审查');
  assert.equal(rows[3].description, '取消当前代码审查');
  assert.equal(rows[3].hint, undefined);
  assert.equal(rows[4].icon, undefined);
  assert.equal(rows[4].description, '其他');
  assert.equal(rows[4].label, undefined);
  dispose();
});

test('Regular 图标在旧尺寸名缺失时仍显示', async () => {
  const review = () => null;
  const status = () => null;
  const cancel = () => null;
  const client = loadClient({
    IconChecklistOutlineRegular: review,
    IconInfoOutlineRegular: status,
    IconCloseOutlineRegular: cancel,
  });
  const commandUi = {
    candidates: async () => ([
      { name: 'review', description: '代码审查' },
      { name: 'review-status', description: '状态' },
      { name: 'review-cancel', description: '取消' },
    ]),
  };
  client.apply({
    inject: (_deps, callback) => callback({ get: name => name === 'commandUi' ? commandUi : undefined }),
  });
  const rows = await commandUi.candidates();
  assert.equal(rows[0].icon, review);
  assert.equal(rows[1].icon, status);
  assert.equal(rows[2].icon, cancel);
});

test('英文宿主语言使用英文斜杠标题', async () => {
  const client = loadClient();
  const commandUi = {
    candidates: async () => ([
      { name: 'review', description: '选择范围或输入自定义要求', hint: '留空提交以选择范围；或输入完整的自定义审查要求', label: '审查' },
      { name: 'review-status', description: '查看最近代码审查报告' },
      { name: 'review-cancel', description: '取消当前代码审查' },
      { name: 'compact', description: '压缩' },
    ]),
  };
  client.apply({
    inject: (_deps, callback) => callback({
      get: name => name === 'commandUi' ? commandUi : name === 'locale' ? { snapshot: { active: 'en_US' } } : undefined,
    }),
  });
  const rows = await commandUi.candidates();
  assert.equal(rows[0].label, 'Review');
  assert.equal(rows[0].description, 'Select a scope or enter custom instructions');
  assert.equal(rows[0].hint, 'Submit empty to select a scope, or enter complete custom review instructions');
  assert.equal(rows[0].icon, reviewIcon);
  assert.equal(rows[1].label, 'Review status');
  assert.equal(rows[1].description, 'Show the latest code review report');
  assert.equal(rows[1].hint, undefined);
  assert.equal(rows[2].label, 'Cancel review');
  assert.equal(rows[2].description, 'Cancel the current code review');
  assert.equal(rows[2].hint, undefined);
  assert.equal(rows[3].description, '压缩');
  assert.equal(rows[3].label, undefined);
});

test('多语言宿主环境表驱动全量覆盖 8 门语言及未知语言回退', async () => {
  const expectations = {
    'zh-CN': {
      label: '审查', desc: '选择范围或输入自定义要求', hint: '留空提交以选择范围；或输入完整的自定义审查要求',
      status: '审查状态', statusDesc: '查看最近代码审查报告',
      cancel: '取消审查', cancelDesc: '取消当前代码审查',
    },
    'en-US': {
      label: 'Review', desc: 'Select a scope or enter custom instructions', hint: 'Submit empty to select a scope, or enter complete custom review instructions',
      status: 'Review status', statusDesc: 'Show the latest code review report',
      cancel: 'Cancel review', cancelDesc: 'Cancel the current code review',
    },
    'ja-JP': {
      label: 'レビュー', desc: '範囲を選択するかカスタム指示を入力', hint: '空のまま送信して範囲を選択、または詳細なカスタムレビュー指示を入力',
      status: 'レビュー状態', statusDesc: '最近のコードレビューレポートを表示',
      cancel: 'レビュー中止', cancelDesc: '現在のコードレビューをキャンセル',
    },
    'es-ES': {
      label: 'Revisión', desc: 'Seleccione un alcance o ingrese instrucciones personalizadas', hint: 'Envíe vacío para seleccionar un alcance, o ingrese instrucciones completas',
      status: 'Estado de revisión', statusDesc: 'Mostrar el informe de revisión más reciente',
      cancel: 'Cancelar revisión', cancelDesc: 'Cancelar la revisión de código actual',
    },
    'fr-FR': {
      label: 'Revue', desc: 'Sélectionnez un périmètre ou entrez des instructions personnalisées', hint: 'Soumettez vide pour sélectionner un périmètre, ou entrez des instructions complètes',
      status: 'État de la revue', statusDesc: 'Afficher le dernier rapport de revue',
      cancel: 'Annuler la revue', cancelDesc: 'Annuler la revue de code actuelle',
    },
    'de-DE': {
      label: 'Review', desc: 'Bereich auswählen oder benutzerdefinierte Anweisungen eingeben', hint: 'Leer absenden für Bereichsauswahl, oder vollständige Anweisungen eingeben',
      status: 'Review-Status', statusDesc: 'Neuesten Code-Review-Bericht anzeigen',
      cancel: 'Review abbrechen', cancelDesc: 'Aktuelles Code-Review abbrechen',
    },
    'ru-RU': {
      label: 'Анализ', desc: 'Выберите диапазон или введите пользовательские инструкции', hint: 'Отправьте пустым для выбора диапазона или введите полные инструкции',
      status: 'Статус анализа', statusDesc: 'Показать последний отчет об анализе кода',
      cancel: 'Отмена анализа', cancelDesc: 'Отменить текущий анализ кода',
    },
    'pt-BR': {
      label: 'Revisão', desc: 'Selecione um escopo ou insira instruções personalizadas', hint: 'Envie vazio para selecionar um escopo ou insira instruções completas',
      status: 'Status da revisão', statusDesc: 'Mostrar o relatório de revisão mais recente',
      cancel: 'Cancelar revisão', cancelDesc: 'Cancelar a revisão de código atual',
    },
    'it-IT': {
      label: 'Review', desc: 'Select a scope or enter custom instructions', hint: 'Submit empty to select a scope, or enter complete custom review instructions',
      status: 'Review status', statusDesc: 'Show the latest code review report',
      cancel: 'Cancel review', cancelDesc: 'Cancel the current code review',
    },
  };

  for (const [activeLocale, exp] of Object.entries(expectations)) {
    const client = loadClient();
    const commandUi = {
      candidates: async () => ([
        { name: 'review', description: '原描述', hint: '原提示', label: '原标题' },
        { name: 'review-status', description: '原状态' },
        { name: 'review-cancel', description: '原取消' },
      ]),
    };
    client.apply({
      inject: (_deps, callback) => callback({
        get: name => name === 'commandUi' ? commandUi : name === 'locale' ? { snapshot: { active: activeLocale } } : undefined,
      }),
    });
    const rows = await commandUi.candidates();
    assert.equal(rows[0].label, exp.label, `Locale ${activeLocale} label mismatch`);
    assert.equal(rows[0].description, exp.desc, `Locale ${activeLocale} description mismatch`);
    assert.equal(rows[0].hint, exp.hint, `Locale ${activeLocale} hint mismatch`);
    assert.equal(rows[1].label, exp.status, `Locale ${activeLocale} status label mismatch`);
    assert.equal(rows[1].description, exp.statusDesc, `Locale ${activeLocale} status description mismatch`);
    assert.equal(rows[1].hint, undefined, `Locale ${activeLocale} status hint should be undefined`);
    assert.equal(rows[2].label, exp.cancel, `Locale ${activeLocale} cancel label mismatch`);
    assert.equal(rows[2].description, exp.cancelDesc, `Locale ${activeLocale} cancel description mismatch`);
    assert.equal(rows[2].hint, undefined, `Locale ${activeLocale} cancel hint should be undefined`);
  }
});
