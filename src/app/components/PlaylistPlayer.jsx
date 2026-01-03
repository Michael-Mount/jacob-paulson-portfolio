"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CoverFlow from "./CoverFlow";
import AlbumDetails from "./AlbumDetails";
import StickyPlayerBar from "./StickyPlayerBar";
import FullscreenLoader from "./FullscreenLoader";

const ALBUM_NOTES = {
  "57hiUYCGPNOdvxyzpBKpwk": {
    title: "music, mastering, artist",
    text: "Corn on my cob",
  },
};

function buildAlbumsFromTracks(tracks) {
  const map = new Map();

  for (const t of tracks) {
    const album = t.album;
    if (!album?.id) continue;

    if (!map.has(album.id)) {
      const coverUrl =
        album.images?.[0]?.url ||
        album.images?.[1]?.url ||
        album.images?.[2]?.url ||
        null;

      map.set(album.id, {
        id: album.id,
        name: album.name,
        coverUrl,
        tracks: [],
      });
    }

    map.get(album.id).tracks.push(t);
  }

  return Array.from(map.values());
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function PlaylistPlayer() {
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState("");

  const [activeAlbumIndex, setActiveAlbumIndex] = useState(0);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [userInteracted, setUserInteracted] = useState(false);

  const albums = useMemo(() => buildAlbumsFromTracks(tracks), [tracks]);

  const activeAlbum = albums[activeAlbumIndex];
  const albumTracks = activeAlbum?.tracks || [];
  const activeTrack = albumTracks[activeTrackIndex];

  const canPlay =
    activeTrack?.preview_state === "ready" && Boolean(activeTrack?.preview_url);

  const initialReady = !loading && !error && albums.length > 0;

  const play = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    setUserInteracted(true);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (audio.paused) play();
    else pause();
  };

  const nextTrack = () => {
    if (!albumTracks.length) return;
    const next = Math.min(activeTrackIndex + 1, albumTracks.length - 1);
    setActiveTrackIndex(next);
  };

  const prevTrack = () => {
    if (!albumTracks.length) return;
    const prev = Math.max(activeTrackIndex - 1, 0);
    setActiveTrackIndex(prev);
  };

  const seekTo = (time) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  };

  useEffect(() => {
    setActiveTrackIndex(0);
  }, [activeAlbumIndex]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/spotify/playlist?limit=45&offset=0");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load playlist.");

        if (!cancelled) {
          setPlaylist(data.playlist);

          setTracks(
            (data.tracks || []).map((t) => ({
              ...t,
              preview_state: t.preview_url ? "ready" : "pending",
            }))
          );

          setActiveAlbumIndex(0);
          setActiveTrackIndex(0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Volume (only need this once)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Load/Play active track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);

    if (!activeTrack?.preview_url) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    audio.src = activeTrack.preview_url;
    audio.load();

    if (userInteracted) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [activeTrack?.id, activeTrack?.preview_url, userInteracted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
    };
  }, []);

  const tracksRef = useRef([]);
  const enrichingRef = useRef(false);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (!tracks.length) return;
    if (enrichingRef.current) return;

    enrichingRef.current = true;
    const controller = new AbortController();

    async function enrichLoop() {
      try {
        while (!controller.signal.aborted) {
          // Only enrich missing previews that are still "pending"
          const current = tracksRef.current;

          const missing = current
            .filter((t) => t.preview_state === "pending")
            .slice(0, 8);

          if (missing.length === 0) return;

          const payload = {
            tracks: missing.map((t) => ({
              id: t.id,
              name: t.name,
              artist: t.artists?.[0]?.name || "",
            })),
          };

          const res = await fetch("/api/spotify/previews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!res.ok) {
            // if the endpoint fails, don't hammer it
            await sleep(1000);
            continue;
          }

          const map = await res.json();

          setTracks((prev) =>
            prev.map((t) => {
              // only touch tracks returned by the map
              if (!(t.id in map)) return t;

              const url = map[t.id];

              if (url) {
                return {
                  ...t,
                  preview_url: url,
                  preview_urls: t.preview_urls?.length ? t.preview_urls : [url],
                  preview_source: "spotify-preview-finder",
                  preview_state: "ready",
                };
              }

              // if null, we tried and found no preview
              return {
                ...t,
                preview_state: "none",
              };
            })
          );

          // Give UI/network breathing room
          await sleep(400);
        }
      } finally {
        enrichingRef.current = false;
      }
    }

    enrichLoop();

    return () => {
      controller.abort();
      enrichingRef.current = false;
    };
  }, [tracks.length]);

  useEffect(() => {
    if (!initialReady) return;

    // Wait until React commits the UI, then wait 1 more frame so the browser paints it
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setShowLoader(false);
      });
      // cleanup inner raf
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [initialReady]);

  useEffect(() => {
    if (!showLoader) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLoader]);

  return (
    <section className="p-6 text-white">
      {showLoader && <FullscreenLoader text="Loading..." />}
      <audio ref={audioRef} />

      {/* Cover Flow */}
      {!loading && !error && albums.length > 0 && (
        <div className="mt-8">
          <p className="text-sm opacity-70 mb-3 text-center">
            Select an album:
          </p>

          <CoverFlow
            albums={albums}
            activeIndex={activeAlbumIndex}
            onSelect={(i) => setActiveAlbumIndex(i)}
          />
        </div>
      )}

      {!loading && !error && activeAlbum && (
        <AlbumDetails
          key={activeAlbum.id}
          album={activeAlbum}
          tracks={albumTracks}
          activeTrackIndex={activeTrackIndex}
          onSelectTrack={(i) => {
            setUserInteracted(true);
            setActiveTrackIndex(i);
          }}
          notes={ALBUM_NOTES[activeAlbum.id]}
        />
      )}

      <StickyPlayerBar
        isVisible={isPlaying}
        track={activeTrack}
        isPlaying={isPlaying}
        canPlay={canPlay}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seekTo}
        volume={volume}
        onVolumeChange={(v) => setVolume(v)}
      />
    </section>
  );
}
