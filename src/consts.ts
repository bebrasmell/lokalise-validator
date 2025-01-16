export const SOURCE_MASKS = [
  /.*\.ts$/,
  /^(?!.*\.d\.ts$).*\.ts$/,
  /.*\.html$/
];
export const IGNORED_DIRS = new Set<string>([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

export const HELP_TEXTS = {
  lang: "Did you specify the correct absolute path to the single language JSON asset?",
  source: "Did you specify the correct absolute path to the source files?",
  report: "Please check if the output path is correct",
  depth: "Please check if the depth is a valid number. Using default depth of 2",
} as const;
export type HelpText = keyof typeof HELP_TEXTS;
export const HELP_TEXT_KEYS = Object.keys(HELP_TEXTS) as HelpText[];
