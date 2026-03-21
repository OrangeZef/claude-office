"use client";

import { Activity } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface StatusMessage {
  text: string;
  type: "info" | "error" | "success";
}

interface StatusToastProps {
  message: StatusMessage | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays a transient status message toast in the header, centered between
 * the title and the controls. Renders nothing when message is null.
 */
export function StatusToast({ message }: StatusToastProps): React.ReactNode {
  if (!message) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-5 py-2 rounded-full border shadow-lg flex items-center gap-3 text-[11px] font-mono font-bold tracking-widest uppercase whitespace-nowrap animate-in slide-in-from-top-2 duration-300 backdrop-blur-md
        ${
          message.type === "success"
            ? "bg-black/90 border-green-400/50 text-green-400 shadow-green-400/20"
            : message.type === "error"
              ? "bg-black/90 border-red-500/50 text-red-400 shadow-red-500/20"
              : "bg-black/90 border-yellow-400/40 text-yellow-400 shadow-yellow-400/15"
        }`}
    >
      <Activity
        size={12}
        className={message.type === "info" ? "animate-pulse" : ""}
      />
      {message.text}
    </div>
  );
}
