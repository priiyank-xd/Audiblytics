import type { NextConfig } from "next";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * HARD-SCOPE-BOUNDARY build-time guard (AR15 part 1, NFR14).
 * Emits a clearly-worded warning when a production build runs without
 * the explicit `NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true` env var.
 * Forces a conscious override to deploy publicly — the API-key-in-
 * localStorage architecture is acceptable for n=1 personal use only.
 *
 * The guard is a `console.warn` (not `throw`) by deliberate choice:
 * Vercel deploys WITH the env var set should build cleanly; deploys
 * WITHOUT the env var should still build (Priyank can self-deploy on
 * personal LAN under HTTPS) but the warning surfaces in CI logs and
 * `pnpm build` output as a friction point.
 *
 * Sources: architecture.md lines 324–330, 538; epics.md AR15 (line 176).
 */
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE !== "true"
) {
  // Next may evaluate config multiple times (sometimes in isolated contexts).
  // Deduplicate per build invocation by writing a short-lived marker into OS tempdir.
  let shouldWarn = true;
  try {
    const slug = encodeURIComponent(process.cwd());
    const markerPath = path.join(os.tmpdir(), `audiblytics-hsb-${slug}`);
    const stat = fs.existsSync(markerPath) ? fs.statSync(markerPath) : null;
    // TTL keeps normal builds warning again, while still deduping within one build run.
    const TTL_MS = 60_000;
    shouldWarn = !stat || Date.now() - stat.mtimeMs > TTL_MS;
    if (shouldWarn) fs.writeFileSync(markerPath, String(Date.now()), { encoding: "utf8" });
  } catch {
    // Best-effort only: if FS is unavailable, fall back to warning.
    shouldWarn = true;
  }

  if (shouldWarn) {
    console.warn(
      "\n⚠ HARD-SCOPE-BOUNDARY: Audiblytics is a single-user personal app. " +
        "API keys live in browser localStorage and the browser calls the LLM " +
        "provider directly — acceptable for n=1 use ONLY. Public deployment " +
        "is forbidden until a backend proxy closes this gate.\n" +
        "  → Set NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true to acknowledge " +
        "this scope and silence this warning.\n" +
        "  → See architecture.md § Authentication & Security (NFR14, AR15).\n",
    );
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
