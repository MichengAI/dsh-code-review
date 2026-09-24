// 输出隔离宿主测试所需的精确官方依赖闭包，避免预发布 peer 范围漂移。
import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/@deepseek-ai/')) continue;
  if (path.startsWith('node_modules/@deepseek-ai/dsh-') && entry.version !== '0.1.7-rc.1') throw new Error(`DSH 依赖漂移：${path}`);
  console.log(`${path.slice('node_modules/'.length)}@${entry.version}`);
}
