import type { Ora } from "ora";

interface Context {
  warnings: [string, string][];
}

export async function extractKeys(
  path: string,
  progress?: Ora
): Promise<[string[], Context]> {
  const langFile = Bun.file(path);
  if (progress) progress.text = `Extracting keys from ${path}`;

  const langRawJson = await langFile.json();
  const ctx: Context = { warnings: [] };
  return [fromRecord(ctx, langRawJson, undefined), ctx];
}

type Field = string | LangJson | string[] | LangJson[];
type LangJson = { [key: string]: Field };

function fromRecord(
  ctx: Context,
  record: Field | undefined,
  path?: string
): string[] {
  if (!record) return [];
  if (typeof record === "string") return path ? [path] : [];

  if (Array.isArray(record)) {
    ctx.warnings.push(["Array", path!]);

    return record
      .map((value, i) => {
        const keyPath = path ? `${path}.${i}` : `${i}`;
        return fromRecord(ctx, value, keyPath);
      })
      .flat();
  }

  if (typeof record === "object") {
    const out = new Array<string>(0);
    for (const key in record) {
      const value = record[key];
      const keyPath = path ? `${path}.${key}` : key;
      out.push(...fromRecord(ctx, value, keyPath));
    }

    return out;
  }

  return [];
}
