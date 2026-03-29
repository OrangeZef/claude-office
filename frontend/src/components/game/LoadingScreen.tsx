/**
 * LoadingScreen Component
 *
 * Displays a pixel-art themed loading screen while office textures load.
 * Pure HTML/CSS overlay with animated title, progress bar, and rotating messages.
 */

"use client";

import { type ReactNode, useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "Booting office...",
  "Loading sprites...",
  "Arranging desks...",
  "Brewing coffee...",
  "Feeding cats...",
];

export function LoadingScreen(): ReactNode {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d0d0d]">
      {/* Pulsing COFFICE title */}
      <h1
        className="font-mono text-4xl font-bold text-yellow-400 tracking-widest mb-8 animate-pulse"
      >
        COFFICE
      </h1>

      {/* Indeterminate progress bar */}
      <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-yellow-400 rounded-full"
          style={{
            width: "40%",
            animation: "loading-slide 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Rotating status message */}
      <p className="font-mono text-xs text-slate-400 tracking-wide h-4">
        {STATUS_MESSAGES[messageIndex]}
      </p>

      {/* Keyframe animation for the progress bar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-slide {
          0% { transform: translateX(-160px); }
          100% { transform: translateX(260px); }
        }
      ` }} />
    </div>
  );
}
