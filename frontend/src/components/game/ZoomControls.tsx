/**
 * ZoomControls Component
 *
 * Provides zoom in/out, reset, and fullscreen controls for the game canvas.
 * Uses react-zoom-pan-pinch hooks for control.
 */

import { type ReactNode, useState, useEffect, useCallback } from "react";
import { useControls } from "react-zoom-pan-pinch";
import { Maximize2, Minimize2 } from "lucide-react";

export function ZoomControls(): ReactNode {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return (
    <div className="absolute bottom-3 right-3 flex flex-row gap-1 z-10">
      <button
        onClick={() => zoomIn()}
        className="w-10 h-10 bg-neutral-800/90 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center text-xl font-bold border border-neutral-600 active:translate-y-[1px] active:scale-95 transition-all"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="w-10 h-10 bg-neutral-800/90 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center text-xl font-bold border border-neutral-600 active:translate-y-[1px] active:scale-95 transition-all"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => resetTransform()}
        className="w-10 h-10 bg-neutral-800/90 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center text-xs font-bold border border-neutral-600 active:translate-y-[1px] active:scale-95 transition-all"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
        aria-label="Reset zoom"
      >
        1:1
      </button>
      <button
        onClick={toggleFullscreen}
        className="w-10 h-10 bg-neutral-800/90 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center border border-neutral-600 active:translate-y-[1px] active:scale-95 transition-all"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
