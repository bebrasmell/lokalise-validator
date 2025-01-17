import type { Ora } from "ora";
import type { LocaleField } from "../util/types/locale-file";
import { readdir, stat } from "fs/promises";
import { join } from "path";

export async function extractKeysMap(
  path: string,
  progress?: Ora
): Promise<Map<string, string>> {
  const langFile = Bun.file(path);
  if (progress) progress.text = `Extracting keys from ${path}`;

  const langRawJson = await langFile.json();
  const map = new Map<string, string>();

  return fromRecord({ map }, langRawJson).map;
}

interface Context {
  map: Map<string, string>;
}

function fromRecord(
  ctx: Context,
  record: LocaleField | undefined,
  path?: string
): Context {
  if (!record) return ctx;
  if (typeof record === "string") {
    if (path) {
      if (ctx.map.has(path)) throw new Error(`Duplicate key: ${path}`);
      ctx.map.set(path, record);
    }

    return ctx;
  }

  if (Array.isArray(record)) {
    for (let i = 0; i < record.length; i++) {
      const value = record[i];
      const keyPath = path ? `${path}.${i}` : `${i}`;
      fromRecord(ctx, value, keyPath);
    }

    return ctx;
  }

  if (typeof record === "object") {
    for (const key in record) {
      const value = record[key];
      const keyPath = path ? `${path}.${key}` : key;
      fromRecord(ctx, value, keyPath);
    }

    return ctx;
  }

  return ctx;
}

export async function extractLocales(
  dirPath: string
): Promise<[string, string][]> {
  const contents = await readdir(dirPath);
  const outFiles = new Array<[string, string]>(0);

  for (const path of contents) {
    const fullPath = join(dirPath, path);
    const isDir = (await stat(fullPath)).isDirectory();

    if (isDir) continue;
    if (!path.endsWith(".json")) continue;

    const lang = path.replace(/\.json$/, "");
    if (lang.length !== 2) continue;

    outFiles.push([lang, fullPath]);
  }

  return outFiles;
}
