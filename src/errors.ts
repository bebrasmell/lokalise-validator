import chalk from "chalk";
import { HELP_TEXT_KEYS, HELP_TEXTS, type HelpText } from "./consts";

export function logError(e?: Error, type?: HelpText): void {
  if (e) console.error(`${chalk.red("Error:")} ${e.message}`);

  if (!type) return;
  console.log(`${chalk.gray(">")} ${HELP_TEXTS[type]}`);
}

export function logWarning(warning: string | HelpText): void {
  if (HELP_TEXT_KEYS.includes(warning as HelpText)) {
    warning = HELP_TEXTS[warning as HelpText];
  }

  console.warn(`${chalk.yellow("Warning:")} ${warning}`);
}
