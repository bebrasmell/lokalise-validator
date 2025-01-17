export function genMetaYamlReport(): string {
  let report = "";
  report += `timestamp: ${Date.now()}\n`;
  // Some more meta here...

  return report;
}
