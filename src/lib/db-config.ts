/**
 * Where the data lives:
 *  1. PostgreSQL (e.g. Neon added from Vercel → Storage) — when a postgres:// URL is in the environment.
 *  2. Demo mode — deployed on Vercel without a database. The deployment's file system is read-only,
 *     so a freshly seeded SQLite file is created in /tmp at startup (see demo-db.ts).
 *     Data resets whenever Vercel starts a new server instance.
 *  3. Local SQLite (prisma/dev.db) — development.
 */

const isPostgres = (v: string | undefined): v is string => !!v && /^postgres(ql)?:\/\//.test(v);

export function postgresUrl(): string | null {
  const known = [process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL].find(isPostgres);
  // Vercel integrations may prefix variable names, e.g. STORAGE_DATABASE_URL.
  const prefixed = Object.entries(process.env).find(
    ([k, v]) => /_(DATABASE_URL|POSTGRES_PRISMA_URL|POSTGRES_URL)$/.test(k) && isPostgres(v),
  )?.[1];
  const url = known ?? prefixed;
  return url ? withPoolerParams(url) : null;
}

/** Neon's pooled endpoint is PgBouncer: disable prepared statements and allow for cold starts. */
function withPoolerParams(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("-pooler") && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "15");
    return u.toString();
  } catch {
    return url;
  }
}

export const DEMO_DB_FILE = "/tmp/narkhan-demo.db";

/** Vercel (or any AWS Lambda) — the deployment's file system is read-only. */
function isServerless() {
  return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
}

export function isDemoMode() {
  return isServerless() && !postgresUrl();
}

/** Explicit datasource URL for PrismaClient, or undefined to use the schema default (DATABASE_URL). */
export function datasourceUrl(): string | undefined {
  const pg = postgresUrl();
  if (pg) return pg;
  if (isServerless()) return `file:${DEMO_DB_FILE}`;
  return undefined;
}
