import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Journal } from '../lib/journal.js';

test('原子记录从启动更新为结束，重建实例后恢复且无残留临时文件', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-review-journal-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const journal = new Journal(directory);
  assert.equal(await journal.read('session'), undefined);
  await journal.write('session', { version: 1, state: 'running', commandId: 'first' });
  const result = { id: 'run', status: 'invalid-output', detail: '格式无效', raw: 'not JSON' };
  await journal.write('session', { version: 1, state: 'finished', result });
  assert.deepEqual((await new Journal(directory).read('session')).result, result);
  assert.equal((await readdir(directory)).length, 1);
  const file = join(directory, 'blocked'); await writeFile(file, 'user fixture');
  await assert.rejects(new Journal(file).write('session', { version: 1, state: 'running', commandId: 'fail' }));
});

test('journal.read 在英文或多语言环境下抛出对应本地化错误', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-review-journal-i18n-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const journal = new Journal(directory);
  // 写入损坏格式的记录（version=2 或缺少字段）
  await journal.write('bad-version', { version: 2, state: 'running', commandId: 'test' });
  await assert.rejects(
    journal.read('bad-version', 'en'),
    /Review record format is not supported\./
  );
  await assert.rejects(
    journal.read('bad-version', 'ja'),
    /レビュー記録の形式はサポートされていません。/
  );
  await assert.rejects(
    journal.read('bad-version', 'zh'),
    /审查记录格式不受支持。/
  );
});
