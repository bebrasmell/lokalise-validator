import chalk from "chalk";
import ora from "ora";
import { parseArgs } from "util";
import { extractKeys } from "./extract-keys";
import { execute, extractFiles, type Context } from "./files";
import { genYamlReport } from "./gen-report";
import { logError, logWarning } from "./errors";

const start_ts = performance.now();

// read all the files in the current directory
const flags = parseArgs({
  args: Bun.argv,
  options: {
    // General options
    path: {
      type: "string",
      short: "p",
    },
    localePath: {
      type: "string",
      short: "l",
    },
    output: {
      type: "string",
      short: "o",
      default: "unused_keys.yml",
    },
    // Config options
    depth: {
      type: "string",
      default: "2",
      short: "d",
    },
  },
  strict: true,
  allowPositionals: true,
});

const dir = flags.values.path;
if (!dir) {
  throw new Error("Source files path is required (--path)");
}

const locale = flags.values.localePath;
if (!locale) {
  throw new Error("Language assets path is required (--langPath)");
}

const outFilePath = flags.values.output!;

let maxDepth = parseInt(flags.values.depth!);
if (isNaN(maxDepth) || maxDepth < 0) {
  logWarning("depth");
  maxDepth = 2;
}

// Extract keys
let progress = ora("Extracting keys...").start();
const [keys, { warnings }] = await extractKeys(locale, progress).catch((e) => {
  progress.fail("Failed to extract keys");
  logError(e, "lang");

  process.exit(1);
});

const keySet = new Set<string>(keys);
progress.succeed(`Extracted ${keySet.size} keys`);

progress = ora("Extracting files...").start();
const files = await extractFiles(dir).catch((e) => {
  progress.fail("Failed to extract files");
  logError(e, "source");

  process.exit(1);
});

// Check files
progress.text = `Checking ${files.length} files`;
const ctx: Context = {
  keySets: { 0: keySet },
  maxDepth,
  depth: 0,
};

await execute(ctx, files);
progress.succeed(`Checked ${files.length} files`);

// Report
progress = ora("Generating report...").start();
const report = genYamlReport(ctx, warnings);
await Bun.file(outFilePath)
  .write(report)
  .catch((e) => {
    progress.fail("Failed to write report");
    logError(e, "report");

    process.exit(1);
  });

progress.succeed(`Report is ready: ${chalk.blue(outFilePath)}`);

const end_ts = performance.now();
const duration = end_ts - start_ts;
const mills = Math.floor(duration % 1000);
const secs = Math.floor(Math.floor(duration / 1_000) % 60);

console.log(`🍾 Done! ${secs}.${mills}s`);
process.exit(0);
