import chalk from "chalk";
import ora from "ora";
import { parseArgs } from "util";
import { displayExTime } from "../util/times/parse-time";
import { extractKeysMap, extractLocales } from "./extract-locales";
import { genMetaYamlReport } from "../util/reports/info";
import { genNoLocaleReport } from "../util/reports/no-locale-report";
import { logError } from "../unused/errors";
import { checkLocales } from "./check-locales";

const start_ts = performance.now();

const flags = parseArgs({
  args: Bun.argv,
  options: {
    path: {
      type: "string",
      short: "p",
    },
    baseLang: {
      type: "string",
      default: "en",
      short: "b",
    },
    output: {
      type: "string",
      short: "o",
      default: "missing_translations.yml",
    },
  },
  strict: true,
  allowPositionals: true,
});

const dir = flags.values.path;
if (!dir) {
  throw new Error("Source files path is required (--path)");
}

const baseLang = flags.values.baseLang!;
if (baseLang.length != 2) {
  throw new Error("Base language must be a two-letter code");
}

const outFilePath = flags.values.output!;
if (!outFilePath) {
  throw new Error("Output file path is required (--output)");
}

let progress = ora("Extracting locales...").start();
const files = await extractLocales(dir);

if (files.length === 0) {
  progress.fail(chalk.red("No locale files found"));
  process.exit(1);
}

progress.text = `Extracting keys for ${files.length} locales...`;
const localeKeys = new Map<string, Map<string, string>>();
for (const [locale, path] of files) {
  const map = await extractKeysMap(path, progress);
  localeKeys.set(locale, map);
}
progress.succeed(`Extracted ${chalk.green(localeKeys.size)} locales`);

const baseMap = localeKeys.get(baseLang);
if (!baseMap) {
  throw new Error(`Base language ${baseLang} not found`);
}

progress = ora("Checking for missing translations...").start();
const missing = checkLocales(localeKeys, baseLang);
progress.succeed(`Found ${chalk.green(missing.size)} untranslated keys`);

progress = ora("Generating report...").start();
let report = genMetaYamlReport();
report += genNoLocaleReport(missing);

await Bun.file(outFilePath)
  .write(report)
  .catch((e) => {
    progress.fail("Failed to write report");
    logError(e, "report");

    process.exit(1);
  });

progress.succeed(`Report is ready: ${chalk.blue(outFilePath)}`);

displayExTime(start_ts, performance.now());

progress.stop();
process.exit(0);
