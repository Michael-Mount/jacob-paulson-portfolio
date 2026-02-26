//NextResponse is automatic JSON.stringify
import { NextResponse } from "next/server";

//Caching token to avoid calling for new token on every call to api
let cachedToken = null;
let cachedTokenExpiresAt = 0;

//Constant Varibales
const PLAYLIST_ID = "6ae6o6YL70bK2smWHo8TNr";
const MARKET = "US";

const DEFAULT_LIMIT = 15;

const PREVIEW_OVERRIDE = {
  "0ZEEYmIXuA9WVl9eDvvtjA":
    "https://p.scdn.co/mp3-preview/3c63a4812fc211120b4a47b5356c53d37049116b",
  "4zYzLmipUl04vEhSJqXB7v":
    "https://p.scdn.co/mp3-preview/bc31870f14686065cd320d16bb75c815d3e31396",
  "71vhQAgQtgeZVe0yILrUSg":
    "https://p.scdn.co/mp3-preview/c7dedfad455ba5cdd65585452a7bc083f1e61004",
};

//Builds the base64 string for api endpoint
function basicAuth(clientId, clientSecret) {
  //buffer turns into bytes
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function getAccessToken() {
  const now = Date.now(); //current time in mill
  //checks to see if now is before the token experiration time
  if (cachedToken && now < cachedTokenExpiresAt) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  //fail test if env aren't passed properly
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify env vars.");
  }

  //calls spotify token endpoint
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(clientId, clientSecret)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  //grabs failed error if can't get the token
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  //Newly gernerated token
  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000;
  return cachedToken;
}

//Make authenticated Spotify GET, checks for errors thrown
async function spotifyGet(token, url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API failed: ${res.status} ${text}`);
  }
  return res.json();
}

//builds the url for querying
async function getPlaylistMeta(token, playlistId, market) {
  const url = new URL(`https://api.spotify.com/v1/playlists/${playlistId}`);
  url.searchParams.set("market", market);
  url.searchParams.set("fields", "id,name,images,external_urls.spotify");
  console.log("Got data");
  return spotifyGet(token, url.toString());
}

//gets tracks in playlist
async function getPlaylistItems(
  token,
  playlistId,
  market,
  limit = 45,
  offset = 0,
) {
  const url = new URL(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
  );
  url.searchParams.set("market", market);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("additional_types", "track");

  url.searchParams.set(
    "fields",
    "items(track(id,name,preview_url,duration_ms,explicit,external_urls.spotify,artists(id,name),album(id,name,images,external_urls.spotify))),total",
  );

  return spotifyGet(token, url.toString());
}

//Reorganizing the data given back for frontend use
function normalizePlaylistItems(items) {
  return items
    .map((it) => it.track)
    .filter(Boolean)
    .map((t) => ({
      id: t.id,
      name: t.name,
      preview_url: t.preview_url,

      preview_urls: t.preview_url ? [t.preview_url] : [],

      duration_ms: t.duration_ms,
      explicit: t.explicit,
      external_url: t.external_urls?.spotify,
      artists: (t.artists || []).map((a) => ({ id: a.id, name: a.name })),
      album: {
        id: t.album?.id,
        name: t.album?.name,
        images: t.album?.images || [],
        external_url: t.album?.external_urls?.spotify,
      },
    }));
}

//The actual Get Request when front end call this route
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.max(
      1,
      Math.min(50, Number(searchParams.get("limit") || DEFAULT_LIMIT)),
    );
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    //Get spotify Token
    const token = await getAccessToken();

    //Fetch the actual playlist data
    const meta = await getPlaylistMeta(token, PLAYLIST_ID, MARKET);
    const page = await getPlaylistItems(
      token,
      PLAYLIST_ID,
      MARKET,
      limit,
      offset,
    );

    //Organize the Data for frontend
    let tracks = normalizePlaylistItems(page.items || []);

    //Override Broken Preview Url
    tracks = tracks.map((t) => {
      const overrideUrl = PREVIEW_OVERRIDE[t.id];
      if (!overrideUrl) return t;

      return {
        ...t,
        preview_url: overrideUrl,
        preview_urls: [overrideUrl],
        preview_source: "manual-override",
      };
    });

    //Send the data back to front
    return NextResponse.json({
      playlist: {
        id: meta.id,
        name: meta.name,
        images: meta.images || [],
        external_url: meta.external_urls?.spotify,
      },
      market: MARKET,
      total: page.total,
      tracks,
      offset,
      limit,
      hasMore: offset + limit < page.total,
      nextOffset: offset + limit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
