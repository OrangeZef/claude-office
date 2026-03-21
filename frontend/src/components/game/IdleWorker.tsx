/**
 * IdleWorker Component
 *
 * Ambient NPC worker that walks in, sits at a random free desk,
 * comments occasionally, then leaves. Yields desk if a real agent arrives.
 * Uses worker sprite variants when available.
 */

"use client";

import { memo, useRef, useCallback, useState, useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useTick } from "@pixi/react";
import { Graphics, TextStyle, Texture } from "pixi.js";

// ============================================================================
// CONSTANTS (match DeskGrid.tsx values exactly)
// ============================================================================

const DESK_START_X = 256;
const DESK_START_Y = 408;
const DESK_SPACING_X = 256;
const DESK_SPACING_Y = 192;
const NUM_DESKS = 8;

const ELEVATOR_ENTRY = { x: 86, y: 300 };
const WALK_SPEED = 60; // px/s

// Sprite sizing (matches AgentSprite scale)
const SPRITE_DISPLAY_W = 48 * 1.8;
const SPRITE_DISPLAY_H = 80 * 1.8;

const COMMENTS = [
  "busy day!", "where's the coffee?", "git push...", "404: break not found",
  "ship it!", "need coffee", "lgtm!", "on a call", "brb",
  "merging PRs", "fixing bugs", "deploying...", "it works!",
  "why is this red?", "stack overflow...", "npm install...", "rubber duck time",
  "nice weather!", "anyone seen the boss?", "deadline soon...",
];

const WORKER_COLORS = [0x6688aa, 0x887744, 0x448866, 0x774488, 0xaa6644];

// Module-level reference counter so multiple IdleWorker instances share one
// elevator open/close signal — prevents one worker closing the elevator while
// another is still inside.
let elevatorUseCount = 0;

// Global variant index ensures workers never reuse the same sprite back-to-back,
// even across multiple workers cycling through variants.
let globalVariantIndex = 0;
function pickNextVariantIndex(totalVariants: number): number {
  const v = globalVariantIndex % totalVariants;
  globalVariantIndex++;
  return v;
}

function openElevatorShared() {
  elevatorUseCount++;
  if (elevatorUseCount === 1) {
    useGameStore.getState().setElevatorState("open");
  }
}

function closeElevatorShared() {
  elevatorUseCount = Math.max(0, elevatorUseCount - 1);
  if (elevatorUseCount === 0) {
    useGameStore.getState().setElevatorState("closed");
  }
}

const BUBBLE_W = 100;
const BUBBLE_H = 22;

type WorkerPhase = "hidden" | "elevator_in" | "walking_in" | "sitting" | "walking_out" | "elevator_out";

// ============================================================================
// PROPS
// ============================================================================

export interface IdleWorkerProps {
  workerVariants?: Texture[][];
  occupiedDeskNums?: Set<number>;
  agentOccupiedDeskNums?: Set<number>;
  instanceIndex?: number; // stagger initial timing
  onClaimDesk?: (deskNum: number) => void;
  onReleaseDesk?: (deskNum: number) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDeskPos(deskNum: number): { x: number; y: number } {
  const i = deskNum - 1;
  const row = Math.floor(i / 4);
  const col = i % 4;
  return {
    x: DESK_START_X + col * DESK_SPACING_X,
    y: DESK_START_Y + row * DESK_SPACING_Y,
  };
}

function pickFreeDeskNum(occupied: Set<number>): number {
  const free: number[] = [];
  for (let i = 1; i <= NUM_DESKS; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  if (free.length === 0) return 1 + Math.floor(Math.random() * NUM_DESKS);
  return free[Math.floor(Math.random() * free.length)];
}

// ============================================================================
// DRAW FUNCTIONS (fallback capsule)
// ============================================================================

function drawWorker(g: Graphics, color: number): void {
  g.clear();
  const W = 24;
  const H = 36;
  const radius = W / 2;
  g.ellipse(0, 2, radius + 2, 4);
  g.fill({ color: 0x000000, alpha: 0.15 });
  g.roundRect(-W / 2, -H, W, H, radius);
  g.fill(color);
  g.stroke({ width: 2, color: 0xffffff });
}

function drawCommentBubble(g: Graphics): void {
  g.clear();
  g.roundRect(-BUBBLE_W / 2, -BUBBLE_H, BUBBLE_W, BUBBLE_H, 4);
  g.fill({ color: 0xffffff, alpha: 0.95 });
  g.stroke({ width: 1, color: 0x888888 });
  g.moveTo(-5, 0);
  g.lineTo(5, 0);
  g.lineTo(0, 5);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.95 });
  g.stroke({ width: 1, color: 0x888888 });
}

// ============================================================================
// COMPONENT
// ============================================================================

function IdleWorkerComponent({
  workerVariants,
  occupiedDeskNums,
  agentOccupiedDeskNums,
  instanceIndex = 0,
  onClaimDesk,
  onReleaseDesk,
}: IdleWorkerProps) {
  // Pick a color for the capsule fallback (cycling through variants)
  const colorRef = useRef(WORKER_COLORS[instanceIndex % WORKER_COLORS.length]);
  const color = colorRef.current;

  // Prop refs — keep useTick closure from capturing stale prop values
  const occupiedDeskNumsRef = useRef(occupiedDeskNums ?? new Set<number>());
  occupiedDeskNumsRef.current = occupiedDeskNums ?? new Set<number>();
  const agentOccupiedDeskNumsRef = useRef(agentOccupiedDeskNums ?? new Set<number>());
  agentOccupiedDeskNumsRef.current = agentOccupiedDeskNums ?? new Set<number>();

  // Refs for mutable state that updates every tick
  const posRef = useRef({ x: ELEVATOR_ENTRY.x, y: ELEVATOR_ENTRY.y });
  const phaseRef = useRef<WorkerPhase>("hidden");
  const phaseTimerRef = useRef(3 + instanceIndex * 8 + Math.random() * 5);
  const commentTimerRef = useRef(8 + Math.random() * 6);
  const currentCommentRef = useRef<string | null>(null);
  const commentDisplayRef = useRef(0);
  const chosenDeskNumRef = useRef(1);
  const chosenDeskPosRef = useRef(getDeskPos(1));
  const variantIndexRef = useRef(0);
  const frameIndexRef = useRef(0);

  const [renderState, setRenderState] = useState({
    x: ELEVATOR_ENTRY.x,
    y: ELEVATOR_ENTRY.y,
    visible: false,
    facingLeft: false,
    comment: null as string | null,
    frameIndex: 0,
    variantIndex: 0,
  });

  const workerDraw = useCallback((g: Graphics) => drawWorker(g, color), [color]);
  const bubbleDraw = useCallback((g: Graphics) => drawCommentBubble(g), []);

  const commentStyle = useMemo<Partial<TextStyle>>(
    () => ({
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 11,
      fill: 0x333333,
    }),
    [],
  );

  useTick((ticker) => {
    const dt = ticker.deltaTime / 60;
    const phase = phaseRef.current;
    const pos = posRef.current;
    const occupied = occupiedDeskNumsRef.current;

    if (phase === "hidden") {
      phaseTimerRef.current -= dt;
      if (phaseTimerRef.current <= 0) {
        // Pick a random free desk and variant
        const deskNum = pickFreeDeskNum(occupied);
        chosenDeskNumRef.current = deskNum;
        chosenDeskPosRef.current = getDeskPos(deskNum);
        // Global round-robin: pick next variant globally so no two workers
        // use the same sprite back-to-back across all worker instances.
        variantIndexRef.current =
          workerVariants && workerVariants.length > 0
            ? pickNextVariantIndex(workerVariants.length)
            : 0;
        frameIndexRef.current = 0;
        posRef.current = { ...ELEVATOR_ENTRY };
        onClaimDesk?.(deskNum);
        phaseRef.current = "elevator_in";
        phaseTimerRef.current = 1.8;
        openElevatorShared();
        setRenderState((s) => ({
          ...s,
          x: ELEVATOR_ENTRY.x,
          y: ELEVATOR_ENTRY.y,
          visible: true,
          variantIndex: variantIndexRef.current,
          frameIndex: 0,
          facingLeft: false,
          comment: null,
        }));
      }
      return;
    }

    // Animate sprite frames (runs for all active phases)
    if (workerVariants && workerVariants.length > 0) {
      const frames = workerVariants[variantIndexRef.current];
      if (frames && frames.length > 1) {
        frameIndexRef.current =
          (frameIndexRef.current + ticker.deltaTime * 0.12) % frames.length;
      }
    }

    if (phase === "elevator_in") {
      phaseTimerRef.current -= dt;
      setRenderState((s) => ({ ...s, frameIndex: Math.floor(frameIndexRef.current) }));
      if (phaseTimerRef.current <= 0) {
        closeElevatorShared();
        phaseRef.current = "walking_in";
        commentTimerRef.current = 8 + Math.random() * 6;
      }
      return;
    }

    if (phase === "walking_in") {
      const desk = chosenDeskPosRef.current;
      const dx = desk.x - pos.x;
      const dy = desk.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        posRef.current = { ...desk };
        phaseRef.current = "sitting";
        phaseTimerRef.current = 18 + Math.random() * 20;
        setRenderState((s) => ({
          ...s,
          x: desk.x,
          y: desk.y,
          frameIndex: Math.floor(frameIndexRef.current),
        }));
        return;
      }
      const step = WALK_SPEED * dt;
      const newX = pos.x + (dx / dist) * Math.min(step, dist);
      const newY = pos.y + (dy / dist) * Math.min(step, dist);
      posRef.current = { x: newX, y: newY };
      setRenderState((s) => ({
        ...s,
        x: newX,
        y: newY,
        facingLeft: dx < 0,
        frameIndex: Math.floor(frameIndexRef.current),
      }));
      return;
    }

    if (phase === "sitting") {
      // Yield desk if a real agent has taken it
      if (agentOccupiedDeskNumsRef.current.has(chosenDeskNumRef.current)) {
        currentCommentRef.current = null;
        phaseRef.current = "walking_out";
        setRenderState((s) => ({ ...s, comment: null }));
        return;
      }

      phaseTimerRef.current -= dt;

      // Comment timer
      commentTimerRef.current -= dt;
      if (commentTimerRef.current <= 0) {
        currentCommentRef.current =
          COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
        commentDisplayRef.current = 2.5;
        commentTimerRef.current = 10 + Math.random() * 8;
      }

      if (commentDisplayRef.current > 0) {
        commentDisplayRef.current -= dt;
        if (commentDisplayRef.current <= 0) {
          currentCommentRef.current = null;
        }
      }

      setRenderState((s) => ({
        ...s,
        comment: currentCommentRef.current,
        frameIndex: Math.floor(frameIndexRef.current),
      }));

      if (phaseTimerRef.current <= 0) {
        currentCommentRef.current = null;
        phaseRef.current = "walking_out";
        setRenderState((s) => ({ ...s, comment: null }));
      }
      return;
    }

    if (phase === "walking_out") {
      const dx = ELEVATOR_ENTRY.x - pos.x;
      const dy = ELEVATOR_ENTRY.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        onReleaseDesk?.(chosenDeskNumRef.current);
        phaseRef.current = "elevator_out";
        phaseTimerRef.current = 1.8;
        openElevatorShared();
        posRef.current = { ...ELEVATOR_ENTRY };
        setRenderState((s) => ({ ...s, x: ELEVATOR_ENTRY.x, y: ELEVATOR_ENTRY.y, facingLeft: false, comment: null }));
        return;
      }
      const step = WALK_SPEED * dt;
      const newX = pos.x + (dx / dist) * Math.min(step, dist);
      const newY = pos.y + (dy / dist) * Math.min(step, dist);
      posRef.current = { x: newX, y: newY };
      setRenderState((s) => ({
        ...s,
        x: newX,
        y: newY,
        facingLeft: dx < 0,
        frameIndex: Math.floor(frameIndexRef.current),
      }));
      return;
    }

    if (phase === "elevator_out") {
      phaseTimerRef.current -= dt;
      setRenderState((s) => ({ ...s, frameIndex: Math.floor(frameIndexRef.current) }));
      if (phaseTimerRef.current <= 0) {
        closeElevatorShared();
        phaseRef.current = "hidden";
        phaseTimerRef.current = 25 + Math.random() * 25;
        setRenderState((s) => ({ ...s, visible: false }));
      }
      return;
    }
  });

  if (!renderState.visible) return null;

  // Resolve active texture — use the synchronous ref (not async renderState)
  // so the correct variant is shown immediately on the first elevator frame.
  const activeFrames =
    workerVariants && workerVariants.length > 0
      ? workerVariants[variantIndexRef.current % workerVariants.length]
      : null;
  const activeTexture =
    activeFrames && activeFrames.length > 0
      ? activeFrames[renderState.frameIndex % activeFrames.length]
      : null;

  return (
    <pixiContainer
      x={renderState.x}
      y={renderState.y}
      zIndex={renderState.y}
      scale={{ x: renderState.facingLeft ? -1 : 1, y: 1 }}
    >
      {activeTexture ? (
        (() => {
          // Uniform scale: all characters render at same height (SPRITE_DISPLAY_H)
          const texH = activeTexture ? activeTexture.height : 320;
          const uniformScale = SPRITE_DISPLAY_H / texH;
          return (
            <pixiSprite
              texture={activeTexture}
              anchor={{ x: 0.5, y: 1 }}
              x={0}
              y={0}
              scale={{ x: uniformScale, y: uniformScale }}
            />
          );
        })()
      ) : (
        <pixiGraphics draw={workerDraw} />
      )}

      {renderState.comment && (
        <pixiContainer x={0} y={-55}>
          <pixiGraphics draw={bubbleDraw} />
          <pixiText
            text={renderState.comment}
            anchor={0.5}
            x={0}
            y={-BUBBLE_H / 2}
            style={commentStyle}
            resolution={2}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
}

export const IdleWorker = memo(IdleWorkerComponent);
