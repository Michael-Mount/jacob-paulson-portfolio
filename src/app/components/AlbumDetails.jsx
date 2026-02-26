"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function AlbumDetails({
  album,
  tracks,
  activeTrackIndex,
  onSelectTrack,
  notes,
}) {
  const tracksRef = useRef(null);
  const notesRef = useRef(null);

  useLayoutEffect(() => {
    if (!tracksRef.current || !notesRef.current) return;

    const ctx = gsap.context(() => {
      gsap.killTweensOf([tracksRef.current, notesRef.current, ".ad-track"]);

      gsap.fromTo(
        tracksRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );

      gsap.fromTo(
        ".ad-track",
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.28,
          ease: "power2.out",
          stagger: 0.03,
          delay: 0.05,
        },
      );

      gsap.fromTo(
        notesRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", delay: 0.08 },
      );
    });

    return () => ctx.revert();
  }, [album?.id]);

  return (
    <section className="mt-10 max-w-6xl mx-auto">
      {/* Outer Container */}
      <div className="rounded-3xl border border-white/10 bg-white/15 backdrop-blur-md overflow-hidden">
        {/* Header Row */}
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {album?.name || "Album"}
          </h2>
          <p className="text-sm text-white/60 mt-1">{tracks.length} tracks</p>
        </div>
        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Track List */}
          <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-white/10">
            <div ref={tracksRef} className="p-6">
              <p className="text-sm text-white/60 mb-4">Tracks</p>
              <div className="space-y-2">
                {tracks.map((t, i) => {
                  const isActive = i === activeTrackIndex;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTrack(i)}
                      className={`ad-track w-full text-left rounded-2xl px-4 py-3 transition ${
                        isActive
                          ? "bg-white/10 border border-white/15"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-sm text-white/60 mt-1">
                        {t.artists?.map((a) => a.name).join(", ")}
                      </p>

                      {t.preview_state === "pending" && (
                        <p className="text-xs text-amber-200/80 mt-2">
                          Finding preview…
                        </p>
                      )}

                      {t.preview_state === "none" && (
                        <p className="text-xs text-white/40 mt-2">
                          No preview available
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <aside ref={notesRef} className=" md:col-span-1">
            <div className="p-6">
              <p className="text-sm text-white/60 mb-4">Work Process</p>
              {notes?.text ? (
                <>
                  {notes?.title && (
                    <h3 className="text-white font-semibold mb-2">
                      {notes.title}
                    </h3>
                  )}
                  <p className="text-white/80 leading-relaxed">{notes.text}</p>
                </>
              ) : (
                <p className="text-white/50 leading-relaxed">
                  Missing Production notes
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
