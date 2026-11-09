import test from 'node:test';
import assert from 'node:assert/strict';
import { readHostLocale, resolveHostLocale, translate, outputLanguage } from '../lib/i18n.js';

const ctx = settings => ({ get: name => name === 'settings' ? settings : undefined });

test('从 settings.describe 读取 locale 配置条目', () => {
  const settings = {
    describe: () => [{ ns: 'theme', value: { preference: 'en' } }, { ns: 'locale', value: { preference: 'en' } }],
  };
  assert.equal(readHostLocale(ctx(settings)), 'en');
  assert.equal(readHostLocale(ctx({
    describe: () => [{ ns: 'locale', value: { preference: 'en-GB' } }],
  })), 'en');
  assert.equal(readHostLocale(ctx({
    describe: () => [{ ns: 'locale', value: { preference: 'ja-JP' } }],
  })), 'ja');
});

test('设置缺失或表单读取失败时默认中文', () => {
  assert.equal(readHostLocale(ctx(undefined)), 'zh');
  assert.equal(readHostLocale({ get() { throw new Error('unavailable'); } }), 'zh');
  assert.equal(readHostLocale(ctx({ describe() { throw new Error('no editor'); } })), 'zh');
  assert.equal(readHostLocale(ctx({ describe: () => [{ ns: 'locale', value: {} }] })), 'zh');
});

test('全量覆盖 8 种官方语言的解析、词条翻译与提示词指令', () => {
  const languages = ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];
  const expectedLabels = {
    zh: '代码审查',
    en: 'Code review',
    ja: 'コードレビュー',
    es: 'Revisión de código',
    fr: 'Revue de code',
    de: 'Code-Review',
    ru: 'Анализ кода',
    pt: 'Revisão de código',
  };
  const expectedNames = {
    zh: 'Simplified Chinese',
    en: 'English',
    ja: 'Japanese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ru: 'Russian',
    pt: 'Portuguese',
  };

  for (const lang of languages) {
    assert.equal(resolveHostLocale(lang), lang);
    assert.equal(resolveHostLocale(`${lang}-XX`), lang);
    assert.equal(translate(lang, '代码审查'), expectedLabels[lang]);
    assert.match(outputLanguage(lang), new RegExp(`Write user-facing review content in ${expectedNames[lang]} as GitHub Flavored Markdown`));
  }

  // 验证未知非支持语言回退 en 与宿主对齐，空/无效值默认 zh
  assert.equal(resolveHostLocale('it-IT'), 'en');
  assert.equal(resolveHostLocale('ko-KR'), 'en');
  assert.equal(resolveHostLocale(''), 'zh');
  assert.equal(resolveHostLocale('   '), 'zh');
  assert.equal(resolveHostLocale(null), 'zh');
  assert.equal(resolveHostLocale(undefined), 'zh');
});
