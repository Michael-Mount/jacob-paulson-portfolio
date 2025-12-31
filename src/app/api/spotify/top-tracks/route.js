import { NextResponse } from "next/server";

export const runtime = "nodejs";

function basicAuth(clientId, clientSecret) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Spotify env vars (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)."
    );
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(clientId, clientSecret)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function getTrackById({ token, trackId, market = "US" }) {
  const res = await fetch(
    `https://api.spotify.com/v1/tracks/${trackId}?market=${market}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get track failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function GET() {
  try {
    const TRACK_ID = "0ZEEYmIXuA9WVl9eDvvtjA";
    const MARKET = "US";

    const token = await getAccessToken();
    const track = await getTrackById({
      token,
      trackId: TRACK_ID,
      market: MARKET,
    });

    return NextResponse.json(track);
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
