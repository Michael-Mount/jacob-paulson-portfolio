export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Alias your typo -> what the package expects
    if (
      !process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_CLIENT_SECERT
    ) {
      process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECERT;
    }

    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const spotifyPreviewFinder = require("spotify-preview-finder");

    const res = await spotifyPreviewFinder("Feeling", "BLUSH", 15);

    return NextResponse.json({ ok: true, res });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
