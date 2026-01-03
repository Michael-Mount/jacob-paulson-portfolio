"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StickyPlayerBar({
  isVisible,
  track,
  isPlaying,
  canPlay,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  volume,
  onVolumeChange,
}) {
  const barRef = useRef(null);

  // GSAP slide in/out
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    if (isVisible) {
      gsap.to(el, { y: 0, duration: 0.35, ease: "power3.out", autoAlpha: 1 });
    } else {
      gsap.to(el, { y: 140, duration: 0.25, ease: "power3.in", autoAlpha: 0 });
    }
  }, [isVisible]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      ref={barRef}
      className="
        fixed left-0 right-0 bottom-0 z-50
        px-4 pb-4
        pointer-events-none
      "
      style={{ transform: "translateY(140px)", opacity: 0 }}
    >
      <div
        className="
          pointer-events-auto
          mx-auto max-w-6xl
          rounded-3xl border border-white/10
          bg-black/70 backdrop-blur-xl
          shadow-2xl
          px-4 py-4
        "
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Track info */}
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold truncate">
              {track?.name || "No track"}
            </p>
            <p className="text-white/60 text-sm truncate mt-1">
              {track?.artists?.map((a) => a.name).join(", ")}{" "}
              {track?.album?.name ? `• ${track.album.name}` : ""}
            </p>

            {/* ✅ Progressive status */}
            {!canPlay && track?.preview_state === "pending" && (
              <p className="text-xs text-amber-200/80 mt-1">Loading preview…</p>
            )}
            {!canPlay && track?.preview_state === "none" && (
              <p className="text-xs text-white/40 mt-1">No preview available</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              disabled={!canPlay}
              className={`px-4 py-2 rounded-xl font-semibold ${
                canPlay
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
            >
              Next
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 md:w-64">
            <span className="text-white/60 text-sm shrink-0">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={!duration}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
