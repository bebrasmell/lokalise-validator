import type { Context } from "../../unused/files";
import { pad } from "./pad";

type Entry = [string, Set<string>];
export function genUnusedYamlReport(
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

  let report = "unused:\n";
  report += `${pad(1)}total: ${entries[0][1].size}\n`;

  const warningsMap = new Map<string, string[]>();
  for (const [type, path] of warnings) {
    if (warningsMap.has(type)) {
      warningsMap.get(type)!.push(path);
    } else {
      warningsMap.set(type, [path]);
    }
  }

  if (warningsMap.size) {
    report += `\n${pad(1)}warnings:\n`;
    for (const key of warningsMap.keys()) {
      report += `${pad(2)}- ${key}:\n`;
      report += `${pad(3)}paths:\n`;
      for (const path of warningsMap.get(key)!) {
        report += `${pad(4)}- ${path}\n`;
      }
    }
  }

  report += `${pad(1)}results:\n`;
  for (const [dStr, keys] of entries) {
    const depth = parseInt(dStr) - 1;

    report += `${pad(2)}- depth: ${depth}\n`;
    report += `${pad(3)}keys:\n`;

    for (let key of keys) {
      for (let i = 0; i < depth; i++) key += ".*";
      report += `${pad(4)}- ${key}\n`;
    }
  }

  return report;
}
