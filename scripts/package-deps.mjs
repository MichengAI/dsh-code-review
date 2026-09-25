// 输出隔离宿主测试所需的精确官方依赖闭包，避免预发布 peer 范围漂移。
// 期望版本从开发依赖推导，不再硬编码：宿主升级只改 package.json 一处。
import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const pinned = new Set(Object.entries(pkg.devDependencies)
  .filter(([name, range]) => name.startsWith('@deepseek-ai/dsh-') && /^\d/.test(range))
  .map(([, range]) => range));
if (pinned.size !== 1) throw new Error(`开发依赖必须把官方 DSH 包钉在同一精确版本：${[...pinned].join(', ')}`);
const expected = [...pinned][0];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/@deepseek-ai/')) continue;
  if (path.startsWith('node_modules/@deepseek-ai/dsh-') && entry.version !== expected) throw new Error(`DSH 依赖漂移：${path} 解析到 ${entry.version}，开发依赖声明 ${expected}`);
  console.log(`${path.slice('node_modules/'.length)}@${entry.version}`);
}
