import { readdir, stat } from "fs/promises";
import { join } from "path";
import { IGNORED_DIRS, SOURCE_MASKS } from "./consts";
import type { Ora } from "ora";
import chalk from "chalk";
import { hashContent } from "./file-hash";
import type { iCache, iCacheRecord, StoreCache } from "./cache";

const _memo = new Map<string, string>();

export async function checkFile(
  path: string,
  keys: Set<string>,
  cache?: StoreCache
): Promise<void> {
  let content = _memo.get(path);
  if (!content) {
    content = await Bun.file(path).text();
    _memo.set(path, content);
  }

  let record: iCacheRecord | undefined;
  if (cache) {
    const { cache: _cache } = cache;
    const rPath = cache.relativePath(path);
    const hash = hashContent(rPath + content);

    record = _cache.get(rPath);
    if (record) {
      if (record.hash === hash && record.keys.size > 0) {
        for (const key of keys) {
          if (record.keys.has(key)) keys.delete(key);
        }
      } else {
        record.keys.clear();
        record.hash = hash;
      }
    } else {
      record = {
        hash: hash,
        keys: new Set(),
      };

      _cache.set(rPath, record);
    }
  }

  const found = new Set<string>();
  for (const key of keys) {
    if (content.includes(key)) {
      keys.delete(key);
      found.add(key);
    }
  }

  if (record) {
    for (const k of found) record.keys.add(k);
  }
}

export async function extractFiles(dirPath: string): Promise<string[]> {
  const files = await readdir(dirPath);
  const outFiles = new Array<string>(0);

  for (const file of files) {
    const fullPath = join(dirPath, file);
    const isDir = (await stat(fullPath)).isDirectory();
    if (isDir) {
      if (IGNORED_DIRS.has(file)) continue;
      const subFiles = await extractFiles(fullPath);
      outFiles.push(...subFiles);
      continue;
    }

    const checked = SOURCE_MASKS.some((mask) => mask.test(file));
    if (checked) outFiles.push(fullPath);
  }

  return outFiles;
}

export async function checkFiles(
  files: string[],
  keys: Set<string>,
  cache?: StoreCache
): Promise<void> {
  for (const file of files) await checkFile(file, keys, cache);
}

export interface Context {
  readonly keySets: { [depth: number]: Set<string> };
  readonly maxDepth: number;
  depth: number;

  cache?: StoreCache;
  progress?: Ora;
}

export async function execute(ctx: Context, files: string[]): Promise<void> {
  if (ctx.depth >= ctx.maxDepth) return;
  const keys = Array.from(ctx.keySets[ctx.depth])
    .map((key) => {
      if (ctx.depth === 0) return key;
      return popKey(key);
    })
    .filter((key) => key.length > 0);

  const nextKeyset = new Set<string>(keys);
  if (nextKeyset.size === 0) return;

  if (ctx.progress) {
    const keyNum = chalk.yellow(nextKeyset.size);
    ctx.progress.text = `Checking ${keyNum} keys at depth ${ctx.depth}`;
  }

  await checkFiles(files, nextKeyset, ctx.cache);


  if (nextKeyset.size === 0) return;

  ctx.depth += 1;
  ctx.keySets[ctx.depth] = nextKeyset;
  return execute(ctx, files);
}

function popKey(key: string): string {
  const slices = key.split(".");
  slices.pop();
  return slices.join(".");
}
