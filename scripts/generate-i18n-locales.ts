#!/usr/bin/env bun
/**
 * Generates all Whispr i18n locale JSON files under src/locales/.
 *
 * Usage: bun run scripts/generate-i18n-locales.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { LOCALE_CODES, LOCALES, NAMESPACES } from "./i18n-locale-data";

const ROOT = join(import.meta.dirname, "..");
const LOCALES_DIR = join(ROOT, "src", "locales");

async function main(): Promise<void> {
  const written: string[] = [];

  for (const lang of LOCALE_CODES) {
    const bundle = LOCALES[lang];
    const langDir = join(LOCALES_DIR, lang);
    await mkdir(langDir, { recursive: true });

    for (const ns of NAMESPACES) {
      const filePath = join(langDir, `${ns}.json`);
      const payload = bundle[ns];
      await writeFile(
        filePath,
        `${JSON.stringify(payload, null, 2)}\n`,
        "utf8",
      );
      written.push(filePath);
      console.log(`Wrote ${filePath.replace(`${ROOT}/`, "")}`);
    }
  }

  console.log(
    `\nDone — ${written.length} locale files written (${LOCALE_CODES.length} languages × ${NAMESPACES.length} namespaces).`,
  );
}

await main();
