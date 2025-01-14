import type { Context } from "./files";

const pad = (depth: number): string => "  ".repeat(depth);

type Entry = [string, Set<string>];
export function genYamlReport(
  src: Context | Entry[],
  warnings: [string, string][]
): string {
  let entries: Entry[];
  if (Array.isArray(src)) {
    entries = src;
  } else {
    entries = Object.entries(src.keySets);
    entries.shift();
  }

  let report = "";
  report += `timestamp: ${Date.now()}\n`;

  const warningsMap = new Map<string, string[]>();
  for (const [type, path] of warnings) {
    if (warningsMap.has(type)) {
      warningsMap.get(type)!.push(path);
    } else {
      warningsMap.set(type, [path]);
    }
  }

  if (warningsMap.size) {
    report += `\nwarnings:\n`;
    for (const key of warningsMap.keys()) {
      report += `${pad(1)}- ${key}:\n`;
      report += `${pad(2)}paths:\n`;
      for (const path of warningsMap.get(key)!) {
        report += `${pad(3)}- ${path}\n`;
      }
    }
  }

  report += `\ntotal: ${entries[0][1].size}\n`;

  report += `results:\n`;
  for (const [dStr, keys] of entries) {
    const depth = parseInt(dStr) - 1;

    report += `${pad(1)}- depth: ${depth}\n`;
    report += `${pad(2)}keys:\n`;

    for (let key of keys) {
      for (let i = 0; i < depth; i++) key += ".*";
      report += `${pad(3)}- ${key}\n`;
    }
  }

  return report;
}
