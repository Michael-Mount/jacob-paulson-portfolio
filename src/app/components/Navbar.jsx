"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Close menu first
    setOpen(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  // Lock body scroll only while menu is open
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => scrollToSection("player")}
          className="shrink-0"
          aria-label="Go to top"
        >
          <img
            src="/images/white-logo.jpg"
            alt="White logo with text saying Jacob Paulson"
            className="h-14 md:h-36 w-auto"
            draggable={false}
          />
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10 text-secondary text-3xl font-league">
          <button type="button" onClick={() => scrollToSection("about")}>
            About
          </button>
          <button type="button" onClick={() => scrollToSection("contact")}>
            Contact
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-secondary"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <div className="flex flex-col gap-1">
            <span
              className={`block h-0.5 w-6 bg-current transition ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile dropdown panel */}
      <div
        className={`md:hidden relative z-[60] overflow-hidden border-t border-white/10 bg-background transition-[max-height,opacity] duration-300 ${
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-4 text-secondary text-2xl font-league">
          <button
            type="button"
            className="text-left py-2"
            onClick={() => scrollToSection("about")}
          >
            About
          </button>
          <button
            type="button"
            className="text-left py-2"
            onClick={() => scrollToSection("contact")}
          >
            Contact
          </button>
        </div>
      </div>

      {open && (
        <button
          type="button"
          className="md:hidden fixed inset-0 top-[72px] z-[55] bg-black/40"
          onClick={() => setOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}
    </header>
  );
}
