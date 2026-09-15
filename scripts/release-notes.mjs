// 发布前校验标签与当前版本，并从同一 CHANGELOG 提取双语发行说明。
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const [tag, output] = process.argv.slice(2);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
assert.match(pkg.version, /^\d+\.\d+\.\d+$/, '仅支持正式版本标签');
assert.equal(tag, `v${pkg.version}`, '标签必须与 package.json 版本一致');
assert.equal(lock.version, pkg.version, '锁文件版本不一致');
assert.equal(lock.packages[''].version, pkg.version, '锁文件根包版本不一致');
assert.ok(output, '缺少说明输出路径');

const lines = readFileSync('CHANGELOG.md', 'utf8').split(/\r?\n/);
const versionHeading = new RegExp(`^## ${pkg.version.replaceAll('.', '\\.')}(?:\\s|$)`);
const start = lines.findIndex(line => versionHeading.test(line));
assert.ok(start >= 0, '缺少当前版本正式发行记录');
const end = lines.findIndex((line, index) => index > start && /^## \d+\.\d+\.\d+(?:\s|$)/.test(line));
const body = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
assert.match(body, /(?:^|\n)##(?:#)? (?:简体中文|中文)\n+[\s\S]*[\u4e00-\u9fff][\s\S]*\n##(?:#)? English\n+[\s\S]*[a-zA-Z]/, '缺少中文或英文发行说明');
writeFileSync(output, `${body}\n`, 'utf8');
