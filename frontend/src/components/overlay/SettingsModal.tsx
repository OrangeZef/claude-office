"use client";

import { ReactNode } from "react";
import Modal from "./Modal";
import {
  usePreferencesStore,
  type ClockType,
  type ClockFormat,
} from "@/stores/preferencesStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps): ReactNode {
  const clockType = usePreferencesStore((s) => s.clockType);
  const clockFormat = usePreferencesStore((s) => s.clockFormat);
  const autoFollowNewSessions = usePreferencesStore(
    (s) => s.autoFollowNewSessions,
  );
  const setClockType = usePreferencesStore((s) => s.setClockType);
  const setClockFormat = usePreferencesStore((s) => s.setClockFormat);
  const setAutoFollowNewSessions = usePreferencesStore(
    (s) => s.setAutoFollowNewSessions,
  );

  const handleClockTypeChange = (type: ClockType) => {
    setClockType(type);
  };

  const handleClockFormatChange = (format: ClockFormat) => {
    setClockFormat(format);
  };

  const handleAutoFollowToggle = () => {
    setAutoFollowNewSessions(!autoFollowNewSessions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-black/30 hover:bg-yellow-400 text-yellow-400 hover:text-black border border-yellow-400/30 hover:border-yellow-400 text-sm font-mono font-bold uppercase tracking-wide rounded-lg transition-all"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        {/* Clock Type */}
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-yellow-400 mb-3">
            Clock Type
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleClockTypeChange("analog")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-mono font-bold transition-all ${
                clockType === "analog"
                  ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-400/20"
                  : "bg-[#0d0d0d] border-yellow-400/15 text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
              }`}
            >
              Analog
            </button>
            <button
              onClick={() => handleClockTypeChange("digital")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-mono font-bold transition-all ${
                clockType === "digital"
                  ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-400/20"
                  : "bg-[#0d0d0d] border-yellow-400/15 text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
              }`}
            >
              Digital
            </button>
          </div>
        </div>

        {/* Time Format - only visible when digital */}
        {clockType === "digital" && (
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-yellow-400 mb-3">
              Time Format
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleClockFormatChange("12h")}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-mono font-bold transition-all ${
                  clockFormat === "12h"
                    ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-400/20"
                    : "bg-[#0d0d0d] border-yellow-400/15 text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
                }`}
              >
                12-hour
              </button>
              <button
                onClick={() => handleClockFormatChange("24h")}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-mono font-bold transition-all ${
                  clockFormat === "24h"
                    ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-lg shadow-yellow-400/20"
                    : "bg-[#0d0d0d] border-yellow-400/15 text-slate-400 hover:border-yellow-400/40 hover:text-yellow-400"
                }`}
              >
                24-hour
              </button>
            </div>
          </div>
        )}

        {/* Session Settings */}
        <div className="pt-4 border-t border-yellow-400/15">
          <label className="block font-mono text-xs uppercase tracking-widest text-yellow-400 mb-3">
            Session Behavior
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={handleAutoFollowToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleAutoFollowToggle();
              }
            }}
            className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d0d] border border-yellow-400/15 cursor-pointer hover:border-yellow-400/30 transition-all duration-200"
          >
            <div>
              <p className="text-slate-300 text-sm font-medium">
                Auto-follow new sessions
              </p>
              <p className="font-mono text-slate-400 text-xs mt-0.5">
                Automatically switch to new sessions in the current project
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full relative transition-colors ${
                autoFollowNewSessions ? "bg-yellow-400" : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-black shadow-md transition-transform duration-200 ${
                  autoFollowNewSessions ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="pt-4 border-t border-yellow-400/15">
          <p className="font-mono text-slate-400 text-xs">
            Tip: Click the clock in the office to quickly cycle between modes.
          </p>
        </div>
      </div>
    </Modal>
  );
}
