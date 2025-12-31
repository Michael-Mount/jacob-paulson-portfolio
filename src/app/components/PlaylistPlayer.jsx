"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CoverFlow from "./CoverFlow";
import AlbumDetails from "./AlbumDetails";
import StickyPlayerBar from "./StickyPlayerBar";

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

export default function PlaylistPlayer() {
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  const canPlay = Boolean(activeTrack?.preview_url);

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
        const res = await fetch("/api/spotify/playlist");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load playlist.");

        if (!cancelled) {
          setPlaylist(data.playlist);
          setTracks(data.tracks || []);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  return (
    <section className="p-6 text-white">
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
