"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

export default function CoverFlow({ albums, activeIndex, onSelect }) {
  const scrollerRef = useRef(null);

  // Keep latest props
  const activeIndexRef = useRef(activeIndex);
  const onSelectRef = useRef(onSelect);

  const rafRef = useRef(0);
  const scrollEndTimerRef = useRef(null);

  const isProgrammaticRef = useRef(false);
  const snapCooldownUntilRef = useRef(0);

  // Drag state (desktop-only)
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const dragMovedRef = useRef(false);

  // Size knobs
  const COVER_SIZE = 250;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    onSelectRef.current = onSelect;
  }, [activeIndex, onSelect]);

  const spacerStyle = useMemo(
    () => ({
      width: `calc(50vw - ${COVER_SIZE / 2}px)`,
      flex: "0 0 auto",
      pointerEvents: "none",
    }),
    [COVER_SIZE],
  );

  const getItems = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll("[data-cover-item]"));
  };

  const applyCoverFlow = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = getItems();
    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    const halfWidth = scroller.clientWidth / 2 || 1;

    items.forEach((item) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distPx = itemCenter - scrollerCenter;
      const dist = distPx / halfWidth;

      const x = Math.max(-1.2, Math.min(1.2, dist));
      const abs = Math.abs(x);

      gsap.set(item, {
        rotateY: x * -45,
        z: (1 - abs) * 240,
        scale: 1 - abs * 0.28,
        opacity: 1 - abs * 0.55,
        zIndex: Math.round((1 - abs) * 100),
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

  const distanceFromCenterPx = (index) => {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;

    const item = scroller.querySelector(`[data-index="${index}"]`);
    if (!item) return 0;

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;

    return itemCenter - scrollerCenter;
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

    if (Math.abs(scroller.scrollLeft - clamped) < 1) {
      applyCoverFlow();
      return;
    }

    isProgrammaticRef.current = true;

    const prevSnap = scroller.style.scrollSnapType;
    scroller.style.scrollSnapType = "none";

    gsap.to(scroller, {
      scrollLeft: clamped,
      duration: 0.65,
      ease: "power3.out",
      onUpdate: applyCoverFlow,
      overwrite: "auto",
      onComplete: () => {
        scroller.style.scrollSnapType = prevSnap;
        isProgrammaticRef.current = false;
        snapCooldownUntilRef.current = performance.now() + 200;
        applyCoverFlow();
      },
    });
  };

  // Scroll listener
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
        if (performance.now() < snapCooldownUntilRef.current) return;

        const nearest = findNearestIndex();
        const dist = distanceFromCenterPx(nearest);

        if (nearest !== activeIndexRef.current) {
          onSelectRef.current(nearest);
          return;
        }

        if (Math.abs(dist) > 2) animateToIndex(nearest);
      }, 140);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [albums.length]);

  // Re-center when parent changes activeIndex
  useEffect(() => {
    if (!albums.length) return;
    animateToIndex(activeIndex);
  }, [activeIndex, albums.length]);

  // Handle layout shifts
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const ro = new ResizeObserver(() => {
      applyCoverFlow();
      if (!isProgrammaticRef.current) {
        const dist = distanceFromCenterPx(activeIndexRef.current);
        if (Math.abs(dist) > 2) animateToIndex(activeIndexRef.current);
      }
    });

    ro.observe(scroller);
    return () => ro.disconnect();
  }, []);

  // Desktop-only drag-to-scroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const DRAG_THRESHOLD_PX = 6;

    const onPointerDown = (e) => {
      if (e.pointerType === "touch") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isProgrammaticRef.current) return;

      isDraggingRef.current = true;
      dragMovedRef.current = false;

      dragStartXRef.current = e.clientX;
      dragStartScrollLeftRef.current = scroller.scrollLeft;

      scroller.setPointerCapture?.(e.pointerId);
      scroller.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current) return;

      const dx = e.clientX - dragStartXRef.current;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) dragMovedRef.current = true;

      scroller.scrollLeft = dragStartScrollLeftRef.current - dx;
    };

    const endDrag = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      scroller.style.cursor = "";
      snapCooldownUntilRef.current = performance.now();
    };

    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointermove", onPointerMove);
    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);
    scroller.addEventListener("pointerleave", endDrag);

    return () => {
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", endDrag);
      scroller.removeEventListener("pointercancel", endDrag);
      scroller.removeEventListener("pointerleave", endDrag);
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-24" />
        <div className="absolute inset-x-0 bottom-0 h-72" />
      </div>

      <ul
        ref={scrollerRef}
        className="
          no-scrollbar
          relative
          flex items-center gap-16
          overflow-x-auto overflow-y-hidden
          py-44
          select-none
        "
        style={{
          WebkitOverflowScrolling: "touch",
          perspective: "1100px",
          scrollSnapType: "none",
          cursor: "grab",
          touchAction: "pan-x",
        }}
        onClickCapture={(e) => {
          if (dragMovedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            dragMovedRef.current = false;
          }
        }}
      >
        <li aria-hidden="true" style={spacerStyle} />

        {albums.map((album, i) => (
          <li
            key={album.id}
            data-cover-item
            data-index={i}
            className="shrink-0 will-change-transform text-secondary"
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="focus:outline-none text-secondary"
              aria-label={`Select album ${album.name}`}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="relative text-secondary">
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ width: COVER_SIZE, height: COVER_SIZE }}
                >
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="object-cover w-full h-full pointer-events-none"
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

        <li aria-hidden="true" style={spacerStyle} />
      </ul>
    </div>
  );
}
