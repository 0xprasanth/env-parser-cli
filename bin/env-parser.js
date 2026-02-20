#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const VERSION = "1.0.0";

function printHelp() {
  console.log(`
envparser - Convert .env file to spreadsheet-friendly formats

USAGE:
  envparser <input-file> [output-file] [options]

OPTIONS:
  -h, --help           Show help
  -v, --version        Show version
  -f, --format <type>  Output format: csv | tsv | json | md
                       (default: csv)

EXAMPLES:
  envparser .env
  envparser .env output.csv
  envparser .env --format tsv
  envparser .env config.json --format json
  envparser .env --format md

DESCRIPTION:
  Converts .env files into formats easily pasteable into Google Sheets,
  Excel, or other tools.
`);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`envparser v${VERSION}`);
    process.exit(0);
  }

  let input = null;
  let output = null;
  let format = "csv";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-f" || args[i] === "--format") {
      format = args[i + 1];
      i++;
    } else if (!input) {
      input = args[i];
    } else if (!output) {
      output = args[i];
    }
  }

  if (!input) {
    console.error("❌ Input file required\n");
    printHelp();
    process.exit(1);
  }

  return { input, output, format };
}

function parseEnv(content) {
  const lines = content.split("\n");
  const result = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result.push({ key, value });
  }

  return result;
}

function formatOutput(data, format) {
  switch (format) {
    case "csv":
      return "KEY,VALUE\n" + data.map(d => `${d.key},${d.value}`).join("\n");

    case "tsv":
      return "KEY\tVALUE\n" + data.map(d => `${d.key}\t${d.value}`).join("\n");

    case "json":
      return JSON.stringify(
        Object.fromEntries(data.map(d => [d.key, d.value])),
        null,
        2
      );

    case "md":
      return (
        "| KEY | VALUE |\n|-----|-------|\n" +
        data.map(d => `| ${d.key} | ${d.value} |`).join("\n")
      );

    default:
      console.error("❌ Invalid format. Use csv | tsv | json | md");
      process.exit(1);
  }
}

function main() {
  const { input, output, format } = parseArgs();

  const absolutePath = path.resolve(process.cwd(), input);

  if (!fs.existsSync(absolutePath)) {
    console.error("❌ File not found:", absolutePath);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const parsed = parseEnv(content);
  const result = formatOutput(parsed, format);

  if (output) {
    const outputPath = path.resolve(process.cwd(), output);
    fs.writeFileSync(outputPath, result);
    console.log(`✅ Output written to: ${outputPath}`);
  } else {
    console.log(result);
  }
}

main();