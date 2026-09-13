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
