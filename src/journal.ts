import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Outcome } from './runtime.js';

export type Record = { version: 1; state: 'running'; commandId: string } | { version: 1; state: 'finished'; result: Outcome };
/** 插件自有原子记录；不向 rc.2 会话写入其持久化读取器不认识的事件。 */
export class Journal {
  constructor(readonly directory: string) {}
  private path(session: string) { return join(this.directory, createHash('sha256').update(session).digest('hex') + '.json'); }
  async read(session: string): Promise<Record | undefined> {
    let raw: string;
    try { raw = await readFile(this.path(session), 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
    const record = JSON.parse(raw) as Record;
    if (record?.version !== 1 || !['running', 'finished'].includes(record.state)) throw new Error('审查记录格式不受支持。');
    if (record.state === 'finished' && (!record.result || typeof record.result.id !== 'string' || typeof record.result.detail !== 'string')) throw new Error('审查记录损坏。');
    return record;
  }
  async write(session: string, record: Record): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const destination = this.path(session), temp = destination + '.' + randomUUID() + '.tmp';
    try {
      await writeFile(temp, JSON.stringify(record) + '\n', { encoding: 'utf8', flag: 'wx', flush: true });
      await rename(temp, destination);
    } catch (error) {
      try { await unlink(temp); } catch (cleanup) { if ((cleanup as NodeJS.ErrnoException).code !== 'ENOENT') throw new AggregateError([error, cleanup], '报告写入及临时文件清理失败'); }
      throw error;
    }
  }
}
