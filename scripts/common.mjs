import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function sourceFile(file) {
  const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  if (/^\s*import\s/m.test(source)) throw new Error(`${file}: 配置不能使用 import，请从 XiaokeLab 获取接口`);
  const matches = [...source.matchAll(/\bexport\s+default\s+/g)];
  if (matches.length !== 1) throw new Error(`${file}: 需要且只能有一个 export default`);
  const m = matches[0];
  const transformed = source.slice(0, m.index) + 'globalThis.__xiaokeConfig = ' + source.slice(m.index + m[0].length);
  new vm.Script(transformed, {filename: path.resolve(file)});
  return transformed;
}
// Includes are ordinary scripts, resolved relative to the course; their globals are
// shared with the config in both the Node validator and the generated HTML.
export function readIncludes(file, includes=[]) {
  return includes.map(name => {
    const filename=path.resolve(path.dirname(path.resolve(file)),name);
    const source=fs.readFileSync(filename,'utf8').replace(/^\uFEFF/,'');
    if(/^\s*(?:import|export)\s/m.test(source)) throw new Error(`${filename}: 附加脚本不能使用 import/export，请使用 globalThis 暴露接口`);
    new vm.Script(source,{filename});
    return {filename,source};
  });
}
export function includeArgs(args) {
  const includes=[];
  for(let i=0;i<args.length;i++) if(args[i]==='--include') {
    if(!args[i+1] || args[i+1].startsWith('-')) throw new Error('--include 需要文件路径');
    includes.push(args[++i]);
  }
  return includes;
}
export function load(file, includes=[]) {
  const source = sourceFile(file);
  const sandbox = {console, setTimeout, clearTimeout, setInterval, clearInterval, performance, TextEncoder, TextDecoder, URL, Uint8Array, Uint8ClampedArray, Float32Array, ArrayBuffer};
  sandbox.window = sandbox; sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  new vm.Script(fs.readFileSync(path.join(root,'runtime/xiaoke-lab.runtime.js'),'utf8'), {filename:'xiaoke-lab.runtime.js'}).runInContext(context, {timeout:10000});
  for(const extra of readIncludes(file,includes)) new vm.Script(extra.source,{filename:extra.filename}).runInContext(context,{timeout:10000});
  new vm.Script(source, {filename:path.resolve(file)}).runInContext(context, {timeout:10000});
  return {config:context.__xiaokeConfig, api:context.XiaokeLab, source};
}
export function fail(error) { console.error(error && error.stack || String(error)); process.exitCode = 1; }
