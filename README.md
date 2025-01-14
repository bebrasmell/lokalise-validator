# Lokalise keys checker

A tool to find unused keys based on locale files.
Scans the workspace directory for files that contain the keys and compares them against the locale file.

## Strategy

This tool uses a depth-based key wild-carding strategy to find keys in the workspace files. This helps avoiding a complex logic of parsing Angular templates and working with AST.

It looks through workspace `.ts` and `.html` files for keys that match patterns, step by step, based on the depth provided:

- Depth 0: `some.example.of.a.long.key` (represents an exact match)
- Depth 1: `some.example.of.a.long` (`some.example.of.a.long.*`)
- Depth 2: `some.example.of.a` (`some.example.of.a.*.*`)
- Depth 3: `some.example.of` (`some.example.of.*.*.*`)

## Installation

To install dependencies:

```bash
bun install
```

## Usage

To run:

```bash
bun unused -p [WORKSPACE_PATH] -l [LANGUAGE_ASSETS_PATH]
```

### Parameters

- `-p` or `--path` - Absolute path to the workspace directory.
- `-l` or `--localePath` - Absolute path to the locale JSON file.
- `-o` or `--output` - The output file path. Default is `./unused_keys.yml`.
- `-d` or `--depth` - Depth of key wild-carding. Default is `2`.

## Report

For better readability, the tool generates a report in **YAML** format. The report includes:

- Warning messages (Arrays warnings for now)
- Unused keys by their depth
- Check timestamp
- Total keys count
