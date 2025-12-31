"use client";

import { useEffect, useRef } from "react";
import { gsap, wrap } from "gsap";
import { ScrollTrigger } from "gsap/all";

export default function ScollIndicator({ targetId = "main", hideAfter = 120 }) {
  const wrapRef = useRef(null);
  const arrowRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const wrap = wrapRef.current;
    const arrow = arrowRef.current;

    if (!wrap || !arrow) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(wrap, { autoAlpha: 1 });

    let bounceTL;
    if (!reduceMotion) {
      bounceTL = gsap.timeline({ repeat: -1 });
      bounceTL
        .to(arrow, { y: 8, duration: 0.75, ease: "power1.inOut" })
        .to(arrow, { y: 0, duration: 0.75, ease: "power1.inOut" });
    }

    const st = ScrollTrigger.create({
      start: 0,
      end: hideAfter,
      onUpdate: (self) => {
        gsap.to(wrap, {
          autoAlpha: 1 - self.progress,
          duration: 0.1,
          overwrite: true,
        });
      },
    });

    return () => {
      st?.kill();
      bounceTL?.kill();
    };
  }, [hideAfter]);

  const onClick = () => {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      ref={wrapRef}
      onClick={onClick}
      className={[
        "fixed bottom-5 md:bottom-8 z-50",
        "right-5 md:right-8",
        "group flex flex-col items-center gap-2",
        "text-secondary/80 hover:text-secondary",
        "transition-opacity",
      ].join(" ")}
    >
      {/* arrow*/}
      <span
        ref={arrowRef}
        className="relative block h-10 w-10 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm"
      >
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-secondary/80" />
      </span>
    </button>
  );
}
