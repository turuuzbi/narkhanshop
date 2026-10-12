import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

/**
 * Serves admin uploads (files added after `next build` aren't served statically).
 * Locally they live in public/uploads; on read-only hosts in /tmp (see saveUploads).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = path.basename(file);
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  for (const dir of [path.join(process.cwd(), "public", "uploads"), path.join(os.tmpdir(), "narkhan-uploads")]) {
    try {
      const data = await fs.readFile(path.join(dir, name));
      return new Response(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } });
    } catch {
      /* not in this directory */
    }
  }
  return new Response("Not found", { status: 404 });
}
