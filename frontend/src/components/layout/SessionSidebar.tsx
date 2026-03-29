"use client";

import { useState, useMemo } from "react";
import {
  History,
  Radio,
  PlayCircle,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GitStatusPanel } from "@/components/game/GitStatusPanel";
import type { Session } from "@/hooks/useSessions";
import { API_BASE_URL } from "@/lib/apiBase";

// ============================================================================
// TYPES
// ============================================================================

interface SessionSidebarProps {
  sessions: Session[];
  sessionsLoading: boolean;
  sessionId: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSessionSelect: (id: string) => Promise<void>;
  onDeleteSession: (session: Session) => void;
  onRefreshSessions: () => Promise<unknown>;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Desktop left sidebar containing the collapsible session browser and git
 * status panel. The collapse toggle always renders so the sidebar remains
 * accessible at its minimum width when collapsed.
 */
export function SessionSidebar({
  sessions,
  sessionsLoading,
  sessionId,
  isCollapsed,
  onToggleCollapsed,
  onSessionSelect,
  onDeleteSession,
  onRefreshSessions,
}: SessionSidebarProps): React.ReactNode {
  const [isClearing, setIsClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        (s.projectName && s.projectName.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q) ||
        (s.displayName && s.displayName.toLowerCase().includes(q)),
    );
  }, [sessions, searchQuery]);

  const handleClearOld = async () => {
    const oldSessions = sessions.filter(
      (s) => s.status === "ended" || s.eventCount === 0,
    );
    if (oldSessions.length === 0) return;
    setIsClearing(true);
    try {
      await Promise.all(
        oldSessions.map((s) =>
          fetch(`${API_BASE_URL}/api/v1/sessions/${s.id}`, {
            method: "DELETE",
          }),
        ),
      );
      await onRefreshSessions();
    } catch {
      // Silently fail
    } finally {
      setIsClearing(false);
    }
  };
  return (
    <aside
      className={`flex flex-col gap-1.5 flex-shrink-0 overflow-hidden transition-all duration-300 ${
        isCollapsed ? "w-10" : "w-72"
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapsed}
        className="flex items-center justify-center p-2 bg-[#0d0d0d] hover:bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-yellow-400/60 hover:text-yellow-400 transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen size={16} />
        ) : (
          <PanelLeftClose size={16} />
        )}
      </button>

      {!isCollapsed && (
        <>
          {/* Session Browser — takes all remaining space */}
          <div
            className="bg-[#0d0d0d]/80 backdrop-blur-sm border border-yellow-400/15 rounded-lg overflow-hidden flex-grow min-h-0 flex flex-col"
            style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)" }}
          >
            <div className="bg-black/40 px-3 py-2 border-b border-yellow-400/15 flex items-center gap-2">
              <History size={14} className="text-yellow-400" />
              <span className="font-mono text-xs uppercase tracking-widest text-yellow-400">
                Sessions
              </span>
              <span className="text-slate-600 font-mono text-xs">
                ({filteredSessions.length}{searchQuery.trim() ? ` / ${sessions.length}` : ""})
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearOld();
                }}
                disabled={isClearing}
                className="ml-auto text-xs text-slate-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
              >
                {isClearing ? "Clearing..." : "Clear Old"}
              </button>
            </div>

            {/* Search input */}
            <div className="px-2 pt-2 pb-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full font-mono text-xs bg-[#0a0a0a] border border-yellow-400/20 text-slate-300 rounded px-2 py-1.5 pr-6 placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-400 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-grow p-2">
              {sessionsLoading && sessions.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-xs italic">
                  Loading sessions...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-xs italic">
                  {searchQuery.trim() ? "No matching sessions" : "No sessions found"}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredSessions.map((session) => {
                    const isActive = session.id === sessionId;
                    const isLive = session.status === "active";
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        key={session.id}
                        className={`group relative w-full px-3 py-2.5 text-left transition-all cursor-pointer rounded-md border-l-2 ${
                          isActive
                            ? "bg-yellow-400/10 border-yellow-400 shadow-md shadow-yellow-400/10"
                            : "border-yellow-400/0 hover:bg-yellow-400/5 hover:border-yellow-400/60 hover:shadow-sm"
                        }`}
                        onClick={() => onSessionSelect(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSessionSelect(session.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isLive ? (
                            <Radio
                              size={10}
                              className="text-emerald-400 animate-pulse flex-shrink-0"
                            />
                          ) : (
                            <PlayCircle
                              size={10}
                              className="text-slate-500 flex-shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs font-mono font-bold truncate flex-1 ${
                              isActive ? "text-yellow-300" : "text-slate-300"
                            }`}
                          >
                            {session.displayName ?? session.projectName ?? "Unknown Project"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-yellow-400/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                            aria-label={`Delete session ${session.id}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono truncate mb-1">
                          {session.id.slice(0, 8)}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                          <span>{session.eventCount} events</span>
                          <span>
                            {formatDistanceToNow(new Date(session.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Git Status Panel — sticks to bottom, sessions takes remaining space */}
          <div className="flex-shrink-0">
            <GitStatusPanel />
          </div>
        </>
      )}
    </aside>
  );
}
