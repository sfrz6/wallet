#!/usr/bin/env node
// Fails if a U+2014 EM DASH character appears in any source file.
// The product specification forbids the em dash in all user-facing (and, for
// safety, all) source text. Use a normal hyphen "-" instead.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "drizzle",
  "playwright-report",
  "test-results",
  "coverage",
]);
const CHECKED_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".html",
]);
// This script references the em dash by code point so the file itself stays clean.
const EM_DASH = String.fromCharCode(0x2014);

/** @type {{file: string, line: number, col: number}[]} */
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry)) walk(full);
      continue;
    }
    if (!CHECKED_EXT.has(extname(entry))) continue;
    // Skip this checker itself; it legitimately names the character.
    if (full.endsWith(join("scripts", "check-emdash.mjs"))) continue;
    const content = readFileSync(full, "utf8");
    if (!content.includes(EM_DASH)) continue;
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
      const col = line.indexOf(EM_DASH);
      if (col !== -1) {
        violations.push({ file: full.replace(ROOT + "\\", "").replace(ROOT + "/", ""), line: i + 1, col: col + 1 });
      }
    });
  }
}

walk(ROOT);

if (violations.length > 0) {
  console.error("Em dash (U+2014) found. Replace with a standard hyphen '-':");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.col}`);
  }
  process.exit(1);
}

console.log("check:emdash passed - no em dash characters found.");
