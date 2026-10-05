import type { Outcome } from './runtime.js';
export type Record = {
    version: 1;
    state: 'running';
    commandId: string;
} | {
    version: 1;
    state: 'finished';
    result: Outcome;
};
/** 插件自有原子记录；不向 rc.2 会话写入其持久化读取器不认识的事件。 */
export declare class Journal {
    readonly directory: string;
    constructor(directory: string);
    private path;
    read(session: string): Promise<Record | undefined>;
    write(session: string, record: Record): Promise<void>;
}
