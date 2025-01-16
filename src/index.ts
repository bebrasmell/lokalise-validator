import chalk from "chalk";
import ora from "ora";
import { parseArgs } from "util";
import { extractKeys } from "./extract-keys";
import { execute, extractFiles, type Context } from "./files";
import { genYamlReport } from "./gen-report";
import { logError } from "./errors";
import { StoreCache } from "./cache";

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
      short: "d",
    },
    noCache: {
      type: "boolean",
      short: "n",
      default: true,
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

const maxDepth = parseInt(flags.values.depth ?? "none") || Infinity;
if (maxDepth === Infinity) {
  console.log(chalk.gray("INFO"), "Running at full depth");
}

if (flags.values.noCache) {
  console.log(chalk.gray("INFO"), "Cache is disabled");
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

let cache: StoreCache | undefined = undefined;
if (!flags.values.noCache) {
  cache = new StoreCache(dir);
  await cache.init();
}

progress.text = `Checking ${files.length} files`;
const ctx: Context = {
  keySets: { 0: keySet },
  progress,
  maxDepth,
  depth: 0,
  cache,
};

await execute(ctx, files);
progress.succeed(`Checked ${files.length} files`);

if (cache) {
  progress = ora("Finalizing cache...").start();
  await cache.finalize();
  progress.succeed(`Cache saved at ${chalk.blue(cache.cachePath)}`);
}

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
