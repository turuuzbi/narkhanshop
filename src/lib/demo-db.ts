import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { DEMO_DB_FILE, isDemoMode } from "./db-config";
import { seedDatabase } from "./seed";

/**
 * Demo mode (Vercel without a database): builds a fresh, seeded SQLite file in /tmp
 * before the first request. Called from src/instrumentation.ts on every cold start.
 * The SQL comes from prisma/migrations (shipped with the function via outputFileTracingIncludes).
 */
export async function ensureDemoDatabase() {
  if (!isDemoMode() || fs.existsSync(DEMO_DB_FILE)) return;

  const started = Date.now();
  const tmpFile = `${DEMO_DB_FILE}.${process.pid}.${started}`;
  const client = new PrismaClient({ datasourceUrl: `file:${tmpFile}` });
  try {
    const dir = path.join(process.cwd(), "prisma", "migrations");
    const migrations = fs
      .readdirSync(dir)
      .filter((d) => fs.existsSync(path.join(dir, d, "migration.sql")))
      .sort();
    for (const m of migrations) {
      const sql = fs.readFileSync(path.join(dir, m, "migration.sql"), "utf8");
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
        .filter(Boolean);
      // SQLite runs one statement per call.
      for (const statement of statements) await client.$executeRawUnsafe(statement);
    }
    await seedDatabase(client);
  } finally {
    await client.$disconnect();
  }

  // Atomic swap so concurrent requests never see a half-built database.
  if (fs.existsSync(DEMO_DB_FILE)) fs.rmSync(tmpFile, { force: true });
  else fs.renameSync(tmpFile, DEMO_DB_FILE);
  console.log(`[demo] Seeded SQLite demo database in ${Date.now() - started}ms`);
}
