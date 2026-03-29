"use client";

import { useState } from "react";
import {
  useGameStore,
  selectBoss,
  selectContextUtilization,
} from "@/stores/gameStore";
import { Terminal } from "lucide-react";
import { AgentStatus } from "@/components/game/AgentStatus";
import { EventLog } from "@/components/game/EventLog";
import { ConversationHistory } from "@/components/game/ConversationHistory";
import type { BossState } from "@/types";

// ============================================================================
// BOSS STATE HELPERS
// ============================================================================

function getBossStateBadge(state: BossState) {
  switch (state) {
    case "idle":
      return { label: "IDLE", bg: "bg-neutral-600/30", text: "text-slate-400", border: "border-neutral-500/30" };
    case "working":
      return { label: "WORKING", bg: "bg-green-600/20", text: "text-green-400", border: "border-green-500/30" };
    case "delegating":
      return { label: "DELEGATING", bg: "bg-yellow-600/20", text: "text-yellow-400", border: "border-yellow-500/30" };
    case "receiving":
      return { label: "RECEIVING", bg: "bg-blue-600/20", text: "text-blue-400", border: "border-blue-500/30" };
    case "waiting_permission":
      return { label: "WAITING", bg: "bg-amber-600/20", text: "text-amber-400 animate-pulse", border: "border-amber-500/30" };
    case "reviewing":
      return { label: "REVIEWING", bg: "bg-purple-600/20", text: "text-purple-400", border: "border-purple-500/30" };
    case "completing":
      return { label: "COMPLETING", bg: "bg-emerald-600/20", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "phone_ringing":
      return { label: "PHONE", bg: "bg-cyan-600/20", text: "text-cyan-400 animate-pulse", border: "border-cyan-500/30" };
    case "on_phone":
      return { label: "ON PHONE", bg: "bg-cyan-600/20", text: "text-cyan-400", border: "border-cyan-500/30" };
    default:
      return { label: String(state).toUpperCase(), bg: "bg-neutral-600/30", text: "text-slate-400", border: "border-neutral-500/30" };
  }
}

function BossStatusCard() {
  const boss = useGameStore(selectBoss);
  const contextUtilization = useGameStore(selectContextUtilization);
  const badge = getBossStateBadge(boss.backendState);
  const pct = Math.round(contextUtilization * 100);

  return (
    <div
      className="bg-[#0d0d0d]/80 backdrop-blur-sm border border-yellow-400/15 rounded-lg p-3 flex-shrink-0"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(234,179,8,0.1)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Terminal size={12} className="text-yellow-400" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-yellow-400 font-bold">
          Boss Status
        </span>
      </div>

      {/* State badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Current task */}
      {boss.currentTask && (
        <div className="text-xs text-slate-300 font-mono truncate mb-2" title={boss.currentTask}>
          {boss.currentTask.length > 60
            ? boss.currentTask.slice(0, 60) + "..."
            : boss.currentTask}
        </div>
      )}

      {/* Context utilization bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wide flex-shrink-0">
          CTX
        </span>
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Desktop right sidebar containing the BossStatus card, AgentStatus panel,
 * and a tabbed Events / Conversation panel below it. Manages its own
 * active-tab state since no other component needs that value.
 */
export function RightSidebar(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<"events" | "conversation">(
    "events",
  );
  const [agentCollapsed, setAgentCollapsed] = useState(true);

  return (
    <aside className="w-80 flex flex-col gap-2 flex-shrink-0 overflow-hidden">
      {/* Boss Status — compact card */}
      <BossStatusCard />

      {/* Agent Status — shrinks to header when collapsed, grows when expanded */}
      <div className="min-h-0" style={{ flex: agentCollapsed ? "0 0 auto" : "2 1 0" }}>
        <AgentStatus onCollapsedChange={setAgentCollapsed} />
      </div>

      {/* Events / Conversation tab panel — takes remaining space */}
      <div className="min-h-0 flex flex-col" style={{ flex: agentCollapsed ? "1 1 0" : "3 1 0" }}>
        {/* Tab header */}
        <div className="flex border-b border-yellow-400/15 bg-[#050505] rounded-t-lg flex-shrink-0">
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-tl-lg active:translate-y-[1px] ${
              activeTab === "events"
                ? "text-[#eab308] border-b-[3px] border-[#eab308] bg-neutral-800/40"
                : "text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/5"
            }`}
            style={{ boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)" }}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("conversation")}
            className={`flex-1 px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all rounded-tr-lg active:translate-y-[1px] ${
              activeTab === "conversation"
                ? "text-[#eab308] border-b-[3px] border-[#eab308] bg-neutral-800/40"
                : "text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/5"
            }`}
            style={{ boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)" }}
          >
            Conversation
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-grow min-h-0">
          {activeTab === "events" ? <EventLog /> : <ConversationHistory />}
        </div>
      </div>
    </aside>
  );
}
