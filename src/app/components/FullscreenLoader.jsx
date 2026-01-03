"use client";

export default function FullscreenLoader({ text = "Loading..." }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-white">
        <img
          src="/images/running.GIF"
          alt="The enginner jacob paulson in an animated format jumping and giving a peace sign."
          className="w-36 h-auto animate-bounce"
          draggable={false}
        />
        <p className="text-md text-secondary/70 animate-pulse">{text}</p>
      </div>
    </div>
  );
}
