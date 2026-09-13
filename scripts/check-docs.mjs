// 检查本项目 Markdown 的本地链接，避免迭代归档后留下旧路径。
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
async function scan(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await scan(path));
    else if (entry.name.endsWith('.md')) result.push(path);
  }
  return result;
}
const files = [resolve('README.md'), resolve('README.zh-CN.md'), ...await scan('docs')];
let links = 0;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\]\(([^)]+)\)|<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const target = (match[1] ?? match[2]).split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    await access(resolve(dirname(file), decodeURIComponent(target))); links++;
  }
}
console.log(`文档校验通过：${files.length} 个 Markdown，${links} 个本地链接。`);
