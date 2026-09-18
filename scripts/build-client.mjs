import { build } from 'esbuild';
// 与家族插件相同的宿主模块加载入口；图标组件由宿主 primitives 提供。
await build({
  entryPoints: ['src/client.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  external: ['@deepseek-ai/dsh-client-ui-primitives'],
  target: 'es2022',
  minify: true,
  sourcemap: true,
  banner: { js: 'window.__ModuleLoader__.load({id:"@michengai/dsh-code-review",factory:(require)=>{var module={exports:{}};var exports=module.exports;' },
  footer: { js: 'return module.exports;}});' },
});
