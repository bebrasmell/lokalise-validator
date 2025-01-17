import { pad } from "./pad";

export function genNoLocaleReport(result: Map<string, Set<string>>): string {
  let report = "no-locale:\n";
  report += `${pad(1)}total: ${result.size}\n`;
  report += `${pad(1)}results:\n`;

  for (const [key, locales] of result) {
    report += `${pad(2)}- key: ${key}\n`;
    report += `${pad(3)}missing:\n`;

    for (const key of locales) report += `${pad(4)}- ${key}\n`;
  }

  return report;
}
