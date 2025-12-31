"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CoverFlow({ albums, activeIndex, onSelect }) {
  const scrollerRef = useRef(null);

  // Keep latest props in refs (prevents stale closure bugs)
  const activeIndexRef = useRef(activeIndex);
  const onSelectRef = useRef(onSelect);

  // Scroll + animation control
  const rafRef = useRef(0);
  const scrollEndTimerRef = useRef(null);
  const isProgrammaticRef = useRef(false);

  // ✅ Size knobs (change these)
  const COVER_SIZE = 300;
  const GAP = 12;
  const REFLECTION_TOP = COVER_SIZE + GAP;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    onSelectRef.current = onSelect;
  }, [activeIndex, onSelect]);

  const getItems = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll("[data-cover-item]"));
  };

  /**
   * Important: use offsetLeft math instead of getBoundingClientRect per item.
   * This is smoother + less flickery during rapid touchpad scroll.
   */
  const applyCoverFlow = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = getItems();
    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    const halfWidth = scroller.clientWidth / 2;

    items.forEach((item) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;

      const distPx = itemCenter - scrollerCenter;
      const dist = distPx / halfWidth;

      const x = Math.max(-1.2, Math.min(1.2, dist));
      const abs = Math.abs(x);

      // Visual knobs
      const rotateY = x * -45;
      const z = (1 - abs) * 240;
      const scale = 1 - abs * 0.28;
      const opacity = 1 - abs * 0.55;
      const zIndex = Math.round((1 - abs) * 100);

      gsap.set(item, {
        rotateY,
        z,
        scale,
        opacity,
        zIndex,
        transformPerspective: 1100,
        transformOrigin: "50% 50%",
      });
    });
  };

  const findNearestIndex = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;

    const items = getItems();
    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;

    let bestIdx = 0;
    let bestDist = Infinity;

    items.forEach((item) => {
      const idx = Number(item.getAttribute("data-index"));
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const d = Math.abs(itemCenter - scrollerCenter);

      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });

    return bestIdx;
  };

  const animateToIndex = (index) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const item = scroller.querySelector(`[data-index="${index}"]`);
    if (!item) return;

    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const target = itemCenter - scroller.clientWidth / 2;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const clamped = Math.max(0, Math.min(maxScroll, target));

    isProgrammaticRef.current = true;

    const prevSnap = scroller.style.scrollSnapType;
    scroller.style.scrollSnapType = "none";

    gsap.to(scroller, {
      scrollLeft: clamped,
      duration: 0.65,
      ease: "power3.out",
      onUpdate: applyCoverFlow,
      onComplete: () => {
        scroller.style.scrollSnapType = prevSnap;
        isProgrammaticRef.current = false;
        applyCoverFlow();
      },
    });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    applyCoverFlow();

    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          applyCoverFlow();
        });
      }

      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);

      scrollEndTimerRef.current = setTimeout(() => {
        if (isProgrammaticRef.current) return;

        const nearest = findNearestIndex();

        if (nearest !== activeIndexRef.current) {
          onSelectRef.current(nearest);
        } else {
          animateToIndex(nearest);
        }
      }, 120);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albums.length]);

  useEffect(() => {
    if (!albums.length) return;
    animateToIndex(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, albums.length]);

  return (
    <div className="relative w-full">
      {/* Stage gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-24 " />
        <div className="absolute inset-x-0 bottom-0 h-72" />
      </div>

      <ul
        ref={scrollerRef}
        className="
        no-scrollbar
          relative
          flex items-center gap-16
          overflow-x-auto overflow-y-hidden
          snap-x snap-mandatory
          px-[45vw] py-44
        "
        style={{
          WebkitOverflowScrolling: "touch",
          perspective: "1100px",
        }}
      >
        {albums.map((album, i) => (
          <li
            key={album.id}
            data-cover-item
            data-index={i}
            className="snap-center shrink-0 will-change-transform text-secondary"
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="focus:outline-none text-secondary"
              aria-label={`Select album ${album.name}`}
            >
              <div className="relative text-secondary">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    draggable={false}
                    className="object-cover w-[200px] h-[200px] md:w-[280px] md:h-[280px]"
                  />
                </div>
              </div>

              <p
                className="mt-4 text-center text-sm text-secondary truncate mx-auto"
                style={{ maxWidth: COVER_SIZE }}
              >
                {album.name}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
