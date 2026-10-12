/** Runs once per server instance, before any request is handled. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureDemoDatabase } = await import("./lib/demo-db");
    await ensureDemoDatabase();
  } catch (e) {
    console.error("[demo] Could not prepare the demo database", e);
  }
}
