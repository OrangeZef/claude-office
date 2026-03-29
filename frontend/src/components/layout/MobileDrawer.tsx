"use client";

import {
  History,
  Radio,
  PlayCircle,
  Play,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GitStatusPanel } from "@/components/game/GitStatusPanel";
import { EventLog } from "@/components/game/EventLog";
import type { Session } from "@/hooks/useSessions";

// ============================================================================
// TYPES
// ============================================================================

interface MobileDrawerProps {
  isOpen: boolean;
  sessions: Session[];
  sessionsLoading: boolean;
  sessionId: string;
  onClose: () => void;
  onSessionSelect: (id: string) => Promise<void>;
  onSimulate: () => Promise<void>;
  onReset: () => void;
  onClearDB: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Mobile full-screen slide-out drawer that contains session controls, the
 * session list, git status, and event log. Rendered only on mobile viewports.
 * The backdrop click closes the drawer.
 */
export function MobileDrawer({
  isOpen,
  sessions,
  sessionsLoading,
  sessionId,
  onClose,
  onSessionSelect,
  onSimulate,
  onReset,
  onClearDB,
}: MobileDrawerProps): React.ReactNode {
  if (!isOpen) return null;

  const handleSimulate = async (): Promise<void> => {
    await onSimulate();
    onClose();
  };

  const handleReset = (): void => {
    onReset();
    onClose();
  };

  const handleClearDB = (): void => {
    onClearDB();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-r border-yellow-400/20 overflow-y-auto animate-in slide-in-from-left duration-300">
        <div className="p-4">
          {/* Drawer Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-mono text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg text-slate-400 hover:text-yellow-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex flex-col gap-2 mb-6">
            <button
              onClick={handleSimulate}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded text-sm font-mono font-bold uppercase tracking-wide transition-colors"
            >
              <Play size={16} fill="currentColor" />
              SIMULATE
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/30 rounded text-sm font-mono font-bold uppercase tracking-wide transition-colors"
            >
              <RefreshCw size={16} />
              RESET
            </button>
            <button
              onClick={handleClearDB}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-sm font-mono font-bold uppercase tracking-wide transition-colors"
            >
              <Trash2 size={16} />
              CLEAR DB
            </button>
          </div>

          {/* Sessions Panel */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-yellow-400" />
              <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">
                Sessions
              </span>
              <span className="text-slate-600 text-xs">
                ({sessions.length})
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {sessionsLoading && sessions.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-xs italic">
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-xs italic">
                  No sessions found
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === sessionId;
                  const isLive = session.status === "active";
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={session.id}
                      className={`px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                        isActive
                          ? "bg-yellow-400/10 border-l-2 border-yellow-400"
                          : "hover:bg-neutral-800/50"
                      }`}
                      onClick={() => {
                        onSessionSelect(session.id);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSessionSelect(session.id);
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isLive ? (
                          <Radio
                            size={10}
                            className="text-emerald-400 animate-pulse"
                          />
                        ) : (
                          <PlayCircle size={10} className="text-slate-500" />
                        )}
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? "text-yellow-400" : "text-slate-300"
                          }`}
                        >
                          {session.displayName ?? session.projectName ?? "Unknown Project"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{session.eventCount} events</span>
                        <span>
                          {formatDistanceToNow(new Date(session.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Git Status Panel */}
          <div className="mb-6">
            <GitStatusPanel />
          </div>

          {/* Event Log */}
          <div>
            <EventLog />
          </div>
        </div>
      </div>
    </div>
  );
}
