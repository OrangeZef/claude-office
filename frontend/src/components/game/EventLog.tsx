/**
 * EventLog - Event log panel
 *
 * Displays event history from the unified Zustand store.
 * Entries are clickable to open a detail modal.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGameStore,
  selectEventLog,
  type EventLogEntry,
} from "@/stores/gameStore";
import { format } from "date-fns";
import { Terminal } from "lucide-react";
import { EventDetailModal } from "@/components/game/EventDetailModal";

function getEventTypeColor(type: string) {
  switch (type) {
    case "pre_tool_use":
      return "text-amber-400";
    case "post_tool_use":
      return "text-emerald-400";
    case "user_prompt_submit":
      return "text-cyan-400";
    case "permission_request":
      return "text-orange-400";
    case "subagent_start":
      return "text-blue-400";
    case "subagent_stop":
      return "text-purple-400";
    case "session_start":
      return "text-green-400";
    case "session_end":
      return "text-slate-500";
    case "stop":
      return "text-rose-400";
    case "error":
      return "text-red-500";
    case "background_task_notification":
      return "text-teal-400";
    default:
      return "text-slate-400";
  }
}

function hasNonEmptyDetail(event: EventLogEntry): boolean {
  return !!event.detail && Object.keys(event.detail).length > 0;
}

export function EventLog() {
  const eventLog = useGameStore(selectEventLog);
  const [selectedEvent, setSelectedEvent] = useState<EventLogEntry | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 60;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Scroll to bottom when events change and user is near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventLog.length]);

  // Scroll to bottom on mount (e.g., when switching back from Conversation tab)
  useEffect(() => {
    // Use requestAnimationFrame to ensure the DOM has rendered
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs">
        <div className="bg-neutral-900 px-3 py-2 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider">
            <Terminal size={14} className="text-orange-500" />
            Event Log
          </div>
          <div className="text-slate-500">{eventLog.length} events</div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto p-2 space-y-1"
        >
          {eventLog.length === 0 ? (
            <div className="text-slate-600 italic text-center p-4 font-mono text-xs">🎙️ Listening for events...</div>
          ) : (
            eventLog.map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                role="button"
                tabIndex={0}
                className="hover:bg-neutral-800/40 px-2 py-1.5 rounded transition-all group border-l-2 border-neutral-700 cursor-pointer hover:border-neutral-500"
                onClick={() => setSelectedEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedEvent(event);
                  }
                }}
              >
                {/* Line 1: Time, Event Type, Agent, Detail indicator */}
                <div className="flex gap-2 items-center">
                  <span className="text-slate-500 flex-shrink-0">
                    {format(event.timestamp, "HH:mm:ss")}
                  </span>
                  <span
                    className={`flex-shrink-0 font-bold text-[9px] uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-800/30 ${getEventTypeColor(event.type)}`}
                  >
                    {event.type.replace(/_/g, " ").toUpperCase()}
                  </span>
                  {event.agentId && (
                    <span className="text-blue-400 text-[10px]">
                      @{event.agentId.slice(0, 8)}...
                    </span>
                  )}
                  {hasNonEmptyDetail(event) && (
                    <span className="ml-auto text-slate-600 group-hover:text-[#eab308] transition-all text-[10px]">
                      ›
                    </span>
                  )}
                </div>
                {/* Line 2: Details/Summary */}
                <div
                  className="text-slate-300 truncate text-[11px]"
                  title={event.summary}
                >
                  {event.summary}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
