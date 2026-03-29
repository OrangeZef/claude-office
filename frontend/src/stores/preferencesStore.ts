"use client";

import { create } from "zustand";
import { API_BASE_URL } from "@/lib/apiBase";

// ============================================================================
// TYPES
// ============================================================================

export type ClockType = "analog" | "digital";
export type ClockFormat = "12h" | "24h";
export type AnimationSpeed = "slow" | "normal" | "fast";

interface PreferencesState {
  clockType: ClockType;
  clockFormat: ClockFormat;
  autoFollowNewSessions: boolean;
  animationSpeed: AnimationSpeed;
  showCats: boolean;
  showIdleWorkers: boolean;
  isLoaded: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  setClockType: (type: ClockType) => Promise<void>;
  setClockFormat: (format: ClockFormat) => Promise<void>;
  setAutoFollowNewSessions: (enabled: boolean) => Promise<void>;
  setAnimationSpeed: (speed: AnimationSpeed) => Promise<void>;
  setShowCats: (show: boolean) => Promise<void>;
  setShowIdleWorkers: (show: boolean) => Promise<void>;
  cycleClockMode: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = `${API_BASE_URL}/api/v1/preferences`;

const DEFAULT_CLOCK_TYPE: ClockType = "digital";
const DEFAULT_CLOCK_FORMAT: ClockFormat = "12h";
const DEFAULT_AUTO_FOLLOW_NEW_SESSIONS = true;
const DEFAULT_ANIMATION_SPEED: AnimationSpeed = "normal";
const DEFAULT_SHOW_CATS = true;
const DEFAULT_SHOW_IDLE_WORKERS = true;

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchPreferences(): Promise<Record<string, string>> {
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      return (await res.json()) as Record<string, string>;
    }
  } catch {
    // Silently fail - use defaults
  }
  return {};
}

async function setPreference(key: string, value: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
  } catch {
    // Silently fail
  }
}

// ============================================================================
// STORE
// ============================================================================

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  clockType: DEFAULT_CLOCK_TYPE,
  clockFormat: DEFAULT_CLOCK_FORMAT,
  autoFollowNewSessions: DEFAULT_AUTO_FOLLOW_NEW_SESSIONS,
  animationSpeed: DEFAULT_ANIMATION_SPEED,
  showCats: DEFAULT_SHOW_CATS,
  showIdleWorkers: DEFAULT_SHOW_IDLE_WORKERS,
  isLoaded: false,

  loadPreferences: async () => {
    const prefs = await fetchPreferences();

    const clockType = (prefs.clock_type as ClockType) || DEFAULT_CLOCK_TYPE;
    const clockFormat =
      (prefs.clock_format as ClockFormat) || DEFAULT_CLOCK_FORMAT;
    const autoFollowRaw = prefs.auto_follow_new_sessions;
    const autoFollowNewSessions =
      autoFollowRaw === undefined
        ? DEFAULT_AUTO_FOLLOW_NEW_SESSIONS
        : autoFollowRaw === "true";

    const animationSpeedRaw = prefs.animation_speed as AnimationSpeed | undefined;
    const animationSpeed =
      animationSpeedRaw === "slow" || animationSpeedRaw === "normal" || animationSpeedRaw === "fast"
        ? animationSpeedRaw
        : DEFAULT_ANIMATION_SPEED;

    const showCatsRaw = prefs.show_cats;
    const showCats =
      showCatsRaw === undefined ? DEFAULT_SHOW_CATS : showCatsRaw === "true";

    const showIdleWorkersRaw = prefs.show_idle_workers;
    const showIdleWorkers =
      showIdleWorkersRaw === undefined
        ? DEFAULT_SHOW_IDLE_WORKERS
        : showIdleWorkersRaw === "true";

    set({
      clockType:
        clockType === "analog" || clockType === "digital"
          ? clockType
          : DEFAULT_CLOCK_TYPE,
      clockFormat:
        clockFormat === "12h" || clockFormat === "24h"
          ? clockFormat
          : DEFAULT_CLOCK_FORMAT,
      autoFollowNewSessions,
      animationSpeed,
      showCats,
      showIdleWorkers,
      isLoaded: true,
    });
  },

  setClockType: async (clockType) => {
    set({ clockType });
    await setPreference("clock_type", clockType);
  },

  setClockFormat: async (clockFormat) => {
    set({ clockFormat });
    await setPreference("clock_format", clockFormat);
  },

  setAutoFollowNewSessions: async (enabled) => {
    set({ autoFollowNewSessions: enabled });
    await setPreference("auto_follow_new_sessions", String(enabled));
  },

  setAnimationSpeed: async (speed) => {
    set({ animationSpeed: speed });
    await setPreference("animation_speed", speed);
  },

  setShowCats: async (show) => {
    set({ showCats: show });
    await setPreference("show_cats", String(show));
  },

  setShowIdleWorkers: async (show) => {
    set({ showIdleWorkers: show });
    await setPreference("show_idle_workers", String(show));
  },

  cycleClockMode: async () => {
    const { clockType, clockFormat } = get();

    // Cycle: analog → digital 12h → digital 24h → analog
    let newClockType: ClockType;
    let newClockFormat: ClockFormat;

    if (clockType === "analog") {
      newClockType = "digital";
      newClockFormat = "12h";
    } else if (clockType === "digital" && clockFormat === "12h") {
      newClockType = "digital";
      newClockFormat = "24h";
    } else {
      newClockType = "analog";
      newClockFormat = "12h";
    }

    set({ clockType: newClockType, clockFormat: newClockFormat });

    // Save both in parallel
    await Promise.all([
      setPreference("clock_type", newClockType),
      setPreference("clock_format", newClockFormat),
    ]);
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

export const selectClockType = (state: PreferencesState) => state.clockType;
export const selectClockFormat = (state: PreferencesState) => state.clockFormat;
export const selectAutoFollowNewSessions = (state: PreferencesState) =>
  state.autoFollowNewSessions;
export const selectAnimationSpeed = (state: PreferencesState) =>
  state.animationSpeed;
export const selectShowCats = (state: PreferencesState) => state.showCats;
export const selectShowIdleWorkers = (state: PreferencesState) =>
  state.showIdleWorkers;
export const selectIsLoaded = (state: PreferencesState) => state.isLoaded;
