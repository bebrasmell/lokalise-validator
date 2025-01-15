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
- etc.

With each iteration, the number of keys will decrease, and eventually, the tool will stop with the keys that never occurred in the workspace files, event being wild-carded.

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
- `-d` or `--depth` - Depth of key wild-carding. Default is `Infinity`.

### Depths

The depth parameter is used to determine how many levels of the key should be wild-carded. For example, if the depth is set to 2, the tool will look for keys that match the pattern `some.example.*.*`. Infinite depth is the default, which means that the tool will look for keys until no more keys are left.

Moving from max depth to 0, the surety of the key being unused decreases.
In this case, the keys left are considered **definitely** unused.

So if you want to extract all the keys that are **definitely** unused, unset the depth.

## Report

For better readability, the tool generates a report in **YAML** format. The report includes:

- Warning messages (Arrays warnings for now)
- Unused keys by their depth
- Check timestamp
- Total keys count
