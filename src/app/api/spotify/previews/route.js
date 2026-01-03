//NextResponse is automatic JSON.stringify
import { NextResponse } from "next/server";
//CreateRequire is used for nodes way of using require on commin Js Packages
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const spotifyPreviewFinder = require("spotify-preview-finder");

const mem = new Map();

//Maps an asynce functino over a list, but only on a certain amount each time (I DONT UNDERSTAND SAW IT IN A YOUTUBE TUTORIAL AND IT WORKS AND THATS FINE BY ME)
async function mapLimit(list, limit, mapper) {
  const results = new Array(list.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= list.length) return;
      results[idx] = await mapper(list[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, list.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const tracks = Array.isArray(body?.tracks) ? body.tracks : [];

    if (tracks.length === 0) {
      return NextResponse.json({});
    }

    // Defensive cap so client can't send the whole playlist at once
    const batch = tracks.slice(0, 8);

    const CONCURRENCY = 4;

    const results = await mapLimit(batch, CONCURRENCY, async (t) => {
      const id = t?.id;
      const name = t?.name || "";
      const artist = t?.artist || "";

      const key = `${name}::${artist}`.toLowerCase();

      if (mem.has(key)) {
        return { id, preview_url: mem.get(key) };
      }

      try {
        const found = artist
          ? await spotifyPreviewFinder(name, artist, 1)
          : await spotifyPreviewFinder(name, 1);

        const first = found?.success ? found.results?.[0] : null;
        const previewUrl = first?.previewUrls?.[0] || null;

        mem.set(key, previewUrl);
        return { id, preview_url: previewUrl };
      } catch {
        mem.set(key, null);
        return { id, preview_url: null };
      }
    });

    const map = {};
    for (const r of results) map[r.id] = r.preview_url;

    return NextResponse.json(map);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
