import { readdir, stat } from "fs/promises";
import { join } from "path";
import { IGNORED_DIRS, SOURCE_MASKS } from "./consts";

const _cache = new Map<string, string>();
export async function checkFile(
  path: string,
  keys: Set<string>
): Promise<void> {
  let content = _cache.get(path);
  if (!content) {
    content = await Bun.file(path).text();
    _cache.set(path, content);
  }

  for (const key of keys) {
    if (content.includes(key)) keys.delete(key);
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
  keys: Set<string>
): Promise<void> {
  for (const file of files) await checkFile(file, keys);
}

export interface Context {
  readonly keySets: { [depth: number]: Set<string> };
  readonly maxDepth: number;
  depth: number;
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
  await checkFiles(files, nextKeyset);

  ctx.depth += 1;
  ctx.keySets[ctx.depth] = nextKeyset;

  return execute(ctx, files);
}

function popKey(key: string): string {
  const slices = key.split(".");
  slices.pop();
  return slices.join(".");
}
