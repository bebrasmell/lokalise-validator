import chalk from "chalk";
import { join, relative } from "node:path";

export interface iCacheRecord {
  hash: string;
  keys: Set<string>;
}
export type iCache = Map<string, iCacheRecord>;

interface iCacheRawRecord {
  path: string;
  hash: string;
  keys: string[];
}

export class StoreCache {
  private readonly _cachePath: string;
  private _contents: iCache | null = null;
  public get cache(): iCache {
    if (!this._contents) throw new Error("Cache not initialized");
    return this._contents;
  }

  public get cachePath(): string {
    return this._cachePath;
  }

  constructor(private readonly _basePath: string) {
    this._cachePath = join(this._basePath, ".i18n-validator.json");
  }

  public relativePath(to: string): string {
    return relative(this._basePath, to);
  }

  public async init(): Promise<iCache> {
    this._contents = new Map<
      string,
      {
        hash: string;
        keys: Set<string>;
      }
    >();

    try {
      const file = Bun.file(this._cachePath);
      const exists = await file.exists();
      if (!exists) throw new Error("Cache file not found");

      const raw = await file.json();
      if (!Array.isArray(raw)) throw new Error("Invalid cache file");

      for (const record of raw) {
        const { path, hash, keys } = record;
        this._contents.set(path, { hash, keys: new Set(keys) });
      }
    } catch (e) {}

    return this._contents;
  }

  public async finalize(): Promise<void> {
    try {
      const file = Bun.file(this._cachePath);
      const records = new Array<iCacheRawRecord>(0);
      if (!this._contents) return;

      for (const [path, { hash, keys }] of this._contents) {
        if (keys.size === 0) continue;

        records.push({
          path,
          hash,
          keys: Array.from(keys),
        });
      }

      await file.write(JSON.stringify(records));
    } catch (e) {
      console.warn(chalk.yellow("WARN"), "Failed to write cache file", e);
    }
  }
}
