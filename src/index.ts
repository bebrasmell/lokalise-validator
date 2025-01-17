import chalk from "chalk";

console.log(
  "Did you forget to specify the command?\nExample:",
  chalk.gray("bun unused --path ./src --locale ./src/locales")
);

process.exit(1);
