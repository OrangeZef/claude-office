"use client";

import {
  Activity,
  Play,
  RefreshCw,
  Bug,
  Trash2,
  HelpCircle,
  Settings,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface HeaderControlsProps {
  isConnected: boolean;
  debugMode: boolean;
  aiSummaryEnabled: boolean | null;
  onSimulate: () => Promise<void>;
  onReset: () => void;
  onClearDB: () => void;
  onToggleDebug: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Desktop-only header controls: action buttons (Simulate, Reset, Clear DB,
 * Debug, Settings, Help) and the connection/AI status display.
 *
 * Hidden on mobile — the MobileDrawer handles those actions instead.
 */
export function HeaderControls({
  isConnected,
  debugMode,
  aiSummaryEnabled,
  onSimulate,
  onReset,
  onClearDB,
  onToggleDebug,
  onOpenSettings,
  onOpenHelp,
}: HeaderControlsProps): React.ReactNode {
  return (
    <div className="flex gap-1.5 lg:gap-3 items-center shrink-0">
      <button
        title="Simulate"
        onClick={onSimulate}
        className="flex items-center gap-1.5 px-2 py-1.5 lg:px-3 bg-yellow-400 hover:bg-yellow-500 text-black border border-yellow-400 rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        style={{ boxShadow: "0 4px 0 #b45309, 0 6px 12px rgba(234,179,8,0.4)", textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
      >
        <Play size={14} fill="currentColor" />
        <span className="hidden lg:inline">SIMULATE</span>
      </button>

      <button
        title="Reset"
        onClick={onReset}
        className="flex items-center gap-1.5 px-2 py-1.5 lg:px-3 bg-[#0d0d0d] hover:bg-yellow-400 text-yellow-400 hover:text-black border border-yellow-400/30 hover:border-yellow-400 rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
      >
        <RefreshCw size={14} />
        <span className="hidden lg:inline">RESET</span>
      </button>

      <button
        title="Clear DB"
        onClick={onClearDB}
        className="flex items-center gap-1.5 px-2 py-1.5 lg:px-3 bg-[#0d0d0d] hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
      >
        <Trash2 size={14} />
        <span className="hidden lg:inline">CLEAR DB</span>
      </button>

      <button
        title={`Debug ${debugMode ? "ON" : "OFF"}`}
        onClick={onToggleDebug}
        className={`flex items-center gap-1.5 px-2 py-1.5 lg:px-3 border rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] ${
          debugMode
            ? "bg-yellow-400/20 text-yellow-300 border-yellow-400"
            : "bg-[#0d0d0d] text-slate-400 border-neutral-500/30 hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/30"
        } focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none`}
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
      >
        <Bug size={14} />
        <span className="hidden lg:inline">DEBUG {debugMode ? "ON" : "OFF"}</span>
      </button>

      <button
        title="Settings"
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-2 py-1.5 lg:px-3 bg-[#0d0d0d] hover:bg-yellow-400 text-yellow-400 hover:text-black border border-yellow-400/30 hover:border-yellow-400 rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
      >
        <Settings size={14} />
        <span className="hidden lg:inline">SETTINGS</span>
      </button>

      <button
        title="Help"
        onClick={onOpenHelp}
        className="flex items-center gap-1.5 px-2 py-1.5 lg:px-3 bg-[#0d0d0d] hover:bg-yellow-400 text-yellow-400 hover:text-black border border-yellow-400/30 hover:border-yellow-400 rounded text-xs font-mono font-bold uppercase tracking-wide transition-all active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
        style={{ boxShadow: "0 3px 0 #171717, 0 4px 8px rgba(0,0,0,0.5)" }}
      >
        <HelpCircle size={14} />
        <span className="hidden lg:inline">HELP</span>
      </button>

      {/* Connection and AI status */}
      <div className="flex flex-col items-end border-l border-yellow-400/15 pl-2 lg:pl-4 shrink-0">
        <span className="text-[10px] uppercase font-mono font-bold text-yellow-400/80 tracking-widest leading-none mb-1 hidden lg:block">
          Status
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 font-mono text-xs ${
              isConnected ? "text-green-400" : "text-rose-500"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected
                  ? "bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  : "bg-red-500"
              }`}
            />
            <span className="hidden lg:inline">{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
          </div>
          <div
            className={`flex items-center gap-1 font-mono text-xs ${
              aiSummaryEnabled ? "text-yellow-400" : "text-slate-500"
            }`}
          >
            <span className="text-[10px]">AI</span>
            <span className="hidden lg:inline">{aiSummaryEnabled ? "ON" : "OFF"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
