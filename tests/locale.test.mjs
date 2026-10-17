import test from 'node:test';
import assert from 'node:assert/strict';
import { readHostLocale } from '../lib/i18n.js';

const ctx = settings => ({ get: name => name === 'settings' ? settings : undefined });

test('从 settings.describe 读取 locale 配置条目', () => {
  const settings = {
    describe: () => [{ ns: 'theme', value: { preference: 'en' } }, { ns: 'locale', value: { preference: 'en' } }],
  };
  assert.equal(readHostLocale(ctx(settings)), 'en');
  assert.equal(readHostLocale(ctx({
    describe: () => [{ ns: 'locale', value: { preference: 'en-GB' } }],
  })), 'en');
});

test('设置缺失或表单读取失败时默认中文', () => {
  assert.equal(readHostLocale(ctx(undefined)), 'zh');
  assert.equal(readHostLocale({ get() { throw new Error('unavailable'); } }), 'zh');
  assert.equal(readHostLocale(ctx({ describe() { throw new Error('no editor'); } })), 'zh');
  assert.equal(readHostLocale(ctx({ describe: () => [{ ns: 'locale', value: {} }] })), 'zh');
});
