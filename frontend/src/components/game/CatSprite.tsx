/**
 * CatSprite Component
 *
 * Renders an animated pixel-art cat that wanders the office floor.
 * Drawn procedurally using PixiJS Graphics — no image files needed.
 * Cat walks on all fours, horizontal body, avoids desk zones.
 */

"use client";

import { memo, useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useTick } from "@pixi/react";
import { Graphics, TextStyle } from "pixi.js";

// ============================================================================
// TYPES
// ============================================================================

export interface CatSpriteProps {
  color: number;       // body fill color e.g. 0x111111 (black) or 0xf5f5f0 (white)
  accentColor: number; // inner ear/detail color
  startX: number;
  startY: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EYE_COLOR = 0x33cc33;
const SPEED = 45; // pixels per second — cats are deliberate walkers
const WALK_FRAME_INTERVAL = 0.25; // seconds per frame

const MEOW_TEXTS = ["meow", "mrrrow", "purrr...", "mew!", "*blinks*", "nya~", "mreow?", "...", "*purrs*"];
const BUBBLE_W = 54;
const BUBBLE_H = 20;

function drawCatBubble(g: Graphics): void {
  g.clear();
  // White rounded rect background
  g.roundRect(-BUBBLE_W / 2, -BUBBLE_H, BUBBLE_W, BUBBLE_H, 4);
  g.fill({ color: 0xffffff, alpha: 0.95 });
  g.stroke({ width: 1, color: 0x888888 });
  // Tiny triangle tail pointing down
  const tailX = 0;
  const tailBaseY = 0;
  g.moveTo(tailX - 4, tailBaseY);
  g.lineTo(tailX + 4, tailBaseY);
  g.lineTo(tailX, tailBaseY + 5);
  g.closePath();
  g.fill({ color: 0xffffff, alpha: 0.95 });
  g.stroke({ width: 1, color: 0x888888 });
}

// Desk bounding boxes — forbidden zones when picking targets.
// Based on DeskGrid constants: DESK_START_X=256, DESK_START_Y=408,
// DESK_SPACING_X=256, DESK_SPACING_Y=192, ROW_SIZE=4.
// Each desk sprite is ~200px wide, ~160px tall; we add generous padding.
const DESK_ZONES = [
  // Row 1 desks (y anchor ≈ 408)
  { minX: 156, maxX: 356, minY: 300, maxY: 460 }, // desk 0 x=256
  { minX: 412, maxX: 612, minY: 300, maxY: 460 }, // desk 1 x=512
  { minX: 668, maxX: 868, minY: 300, maxY: 460 }, // desk 2 x=768
  { minX: 924, maxX: 1124, minY: 300, maxY: 460 }, // desk 3 x=1024
  // Row 2 desks (y anchor ≈ 600)
  { minX: 156, maxX: 356, minY: 490, maxY: 650 }, // desk 4 x=256
  { minX: 412, maxX: 612, minY: 490, maxY: 650 }, // desk 5 x=512
  { minX: 668, maxX: 868, minY: 490, maxY: 650 }, // desk 6 x=768
  { minX: 924, maxX: 1124, minY: 490, maxY: 650 }, // desk 7 x=1024
  // Boss desk area (BOSS_RUG_POSITION x=640, y=940)
  { minX: 520, maxX: 760, minY: 820, maxY: 1000 },
];

function isInDeskZone(x: number, y: number): boolean {
  return DESK_ZONES.some(
    (z) => x >= z.minX && x <= z.maxX && y >= z.minY && y <= z.maxY,
  );
}

// Points of interest cats will visit (cat furniture, food area)
const CAT_POIS = [
  { x: 1130, y: 840 },  // cat bed (right)
  { x: 400,  y: 880 },  // cat bed (middle)
  { x: 140,  y: 760 },  // cat tree (left)
  { x: 950,  y: 280 },  // cat tree (top right)
  { x: 1140, y: 275 },  // cat food area
];

// Safe corridor zones between and around desk rows
const WALK_ZONES = [
  { minY: 250, maxY: 300, minX: 100, maxX: 1180 }, // Above desk row 1 (narrow corridor)
  { minY: 460, maxY: 490, minX: 100, maxX: 156 },   // Left gap between rows
  { minY: 460, maxY: 490, minX: 1124, maxX: 1180 }, // Right gap between rows
  { minY: 650, maxY: 820, minX: 100, maxX: 156 },   // Left side below row 2
  { minY: 650, maxY: 820, minX: 1124, maxX: 1180 }, // Right side below row 2
  { minY: 650, maxY: 750, minX: 356, maxX: 412 },   // Center-left gap between desks
  { minY: 650, maxY: 750, minX: 868, maxX: 924 },   // Center-right gap between desks
];

// ============================================================================
// HELPERS
// ============================================================================

function pickNewTarget(): { x: number; y: number } {
  // 35% chance to visit a cat POI instead of random zone
  if (Math.random() < 0.35) {
    const poi = CAT_POIS[Math.floor(Math.random() * CAT_POIS.length)];
    return poi;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const zone = WALK_ZONES[Math.floor(Math.random() * WALK_ZONES.length)];
    const x = zone.minX + Math.random() * (zone.maxX - zone.minX);
    const y = zone.minY + Math.random() * (zone.maxY - zone.minY);
    if (!isInDeskZone(x, y)) {
      return { x, y };
    }
  }
  // Fallback: top corridor, always safe
  return {
    x: 100 + Math.random() * 1080,
    y: 270 + Math.random() * 20,
  };
}

function drawCat(
  g: Graphics,
  color: number,
  accentColor: number,
  walkFrame: number,
): void {
  g.clear();

  // ---- Layout (horizontal, low-to-ground cat, fits ~40x24px) ----
  // Anchor: center of body mass
  // Body center: (0, 0)
  // Head at front of body: (+18, -2)
  // Tail at back of body: (-15, 0) curving up
  // Legs below body: y from +4 to +12

  const bodyW = 30;
  const bodyH = 14;
  const bodyX = 0;
  const bodyY = 0;

  // Shadow
  g.ellipse(bodyX, bodyY + bodyH / 2 + 1, 18, 3);
  g.fill({ color: 0x000000, alpha: 0.18 });

  // Body — horizontal rounded rect
  g.roundRect(bodyX - bodyW / 2, bodyY - bodyH / 2, bodyW, bodyH, 5);
  g.fill(color);
  g.stroke({ width: 0.5, color: accentColor, alpha: 0.5 });

  // ---- Tail (back of body, curves up and forward) ----
  const tailStartX = bodyX - bodyW / 2; // -15
  const tailStartY = bodyY;
  g.moveTo(tailStartX, tailStartY);
  g.bezierCurveTo(
    tailStartX - 8,  tailStartY - 6,
    tailStartX - 14, tailStartY - 18,
    tailStartX - 6,  tailStartY - 22,
  );
  g.stroke({ width: 3, color, cap: "round" });

  // ---- Head (front of body, slightly above) ----
  const headX = bodyX + 18;
  const headY = bodyY - 2;

  g.circle(headX, headY, 8);
  g.fill(color);
  g.stroke({ width: 0.5, color: accentColor, alpha: 0.4 });

  // Left ear triangle (top of head, 5px tall, 5px base, separated 6px)
  const earL = headX - 3;
  const earR = headX + 3;
  const earBase = headY - 6;
  const earTip = headY - 11;

  g.moveTo(earL - 2, earBase);
  g.lineTo(earL, earTip);
  g.lineTo(earL + 3, earBase);
  g.closePath();
  g.fill(color);

  // Left ear inner
  g.moveTo(earL - 1, earBase - 1);
  g.lineTo(earL, earTip + 2);
  g.lineTo(earL + 2, earBase - 1);
  g.closePath();
  g.fill(accentColor);

  // Right ear triangle
  g.moveTo(earR - 2, earBase);
  g.lineTo(earR, earTip);
  g.lineTo(earR + 3, earBase);
  g.closePath();
  g.fill(color);

  // Right ear inner
  g.moveTo(earR - 1, earBase - 1);
  g.lineTo(earR, earTip + 2);
  g.lineTo(earR + 2, earBase - 1);
  g.closePath();
  g.fill(accentColor);

  // Eyes (front of head, r=2)
  g.circle(headX + 2, headY - 1, 2);
  g.fill(EYE_COLOR);
  g.circle(headX + 6, headY - 1, 2);
  g.fill(EYE_COLOR);

  // Eye shine
  g.circle(headX + 3, headY - 2, 0.7);
  g.fill(0xffffff);
  g.circle(headX + 7, headY - 2, 0.7);
  g.fill(0xffffff);

  // Nose dot (r=1.5, below eyes)
  g.circle(headX + 4, headY + 2, 1.5);
  g.fill(0xff9999);

  // ---- 4 Legs (5x8px rects below body) ----
  // Front legs at x+8, x+14 from body center; back legs at x-8, x-14
  // walkFrame 0: frontLeft+backRight forward (y+2), frontRight+backLeft lifted (y-2)
  // walkFrame 1: opposite
  const legW = 5;
  const legH = 8;
  const legTopY = bodyY + bodyH / 2; // top of legs = bottom of body

  const frontLeftX  = bodyX + 8;
  const frontRightX = bodyX + 14;
  const backLeftX   = bodyX - 8;
  const backRightX  = bodyX - 14;

  // walkFrame 0: frontLeft forward, frontRight back, backRight forward, backLeft back
  const frontLeftOff  = walkFrame === 0 ?  2 : -2;
  const frontRightOff = walkFrame === 0 ? -2 :  2;
  const backRightOff  = walkFrame === 0 ?  2 : -2;
  const backLeftOff   = walkFrame === 0 ? -2 :  2;

  g.rect(frontLeftX  - legW / 2, legTopY + frontLeftOff,  legW, legH);
  g.fill(color);
  g.rect(frontRightX - legW / 2, legTopY + frontRightOff, legW, legH);
  g.fill(color);
  g.rect(backLeftX   - legW / 2, legTopY + backLeftOff,   legW, legH);
  g.fill(color);
  g.rect(backRightX  - legW / 2, legTopY + backRightOff,  legW, legH);
  g.fill(color);
}

// ============================================================================
// COMPONENT
// ============================================================================

function CatSpriteComponent({ color, accentColor, startX, startY }: CatSpriteProps) {
  const posRef = useRef({ x: startX, y: startY });
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const pauseRef = useRef(1.0 + Math.random() * 2); // start with a random pause
  const walkTimerRef = useRef(0);
  const walkFrameRef = useRef(0);
  const facingLeftRef = useRef(false);

  // Reactive state for things that must trigger re-render
  const [renderState, setRenderState] = useState({
    x: startX,
    y: startY,
    walkFrame: 0,
    facingLeft: false,
  });

  // Bubble state
  const [bubbleText, setBubbleText] = useState<string | null>(null);

  // Refs for both timer handles so both can be cancelled on unmount
  const outerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule meow bubbles with random intervals
  useEffect(() => {
    function scheduleNext() {
      const delay = (8 + Math.random() * 7) * 1000; // 8–15 seconds
      outerTimerRef.current = setTimeout(() => {
        const text = MEOW_TEXTS[Math.floor(Math.random() * MEOW_TEXTS.length)];
        setBubbleText(text);
        innerTimerRef.current = setTimeout(() => {
          setBubbleText(null);
          scheduleNext();
        }, 2500);
      }, delay);
    }
    scheduleNext();
    return () => {
      if (outerTimerRef.current) clearTimeout(outerTimerRef.current);
      if (innerTimerRef.current) clearTimeout(innerTimerRef.current);
    };
  }, []);

  const drawCallback = useCallback(
    (g: Graphics) => {
      drawCat(g, color, accentColor, renderState.walkFrame);
    },
    [color, accentColor, renderState.walkFrame, renderState.facingLeft],
  );

  const bubbleStyle = useMemo<Partial<TextStyle>>(
    () => ({
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 12,
      fill: 0x333333,
    }),
    [],
  );

  useTick((ticker) => {
    const dt = ticker.deltaTime / 60; // seconds

    if (pauseRef.current > 0) {
      pauseRef.current -= dt;
      return;
    }

    // Pick a new target if we don't have one
    if (!targetRef.current) {
      targetRef.current = pickNewTarget();
    }

    const pos = posRef.current;
    const target = targetRef.current;
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      // Arrived — pause 2–5 seconds then pick new target
      posRef.current = { x: target.x, y: target.y };
      targetRef.current = null;
      pauseRef.current = 2 + Math.random() * 3;
      setRenderState((s) => ({
        ...s,
        x: target.x,
        y: target.y,
      }));
      return;
    }

    // Move toward target
    const step = SPEED * dt;
    const newX = pos.x + (dx / dist) * Math.min(step, dist);
    const newY = pos.y + (dy / dist) * Math.min(step, dist);
    posRef.current = { x: newX, y: newY };

    // Update facing direction (scale.x flip applied on container)
    if (dx < 0) facingLeftRef.current = true;
    else if (dx > 0) facingLeftRef.current = false;

    // Walk animation — alternate every WALK_FRAME_INTERVAL seconds
    walkTimerRef.current += dt;
    if (walkTimerRef.current >= WALK_FRAME_INTERVAL) {
      walkTimerRef.current = 0;
      walkFrameRef.current = walkFrameRef.current === 0 ? 1 : 0;
    }

    setRenderState({
      x: newX,
      y: newY,
      walkFrame: walkFrameRef.current,
      facingLeft: facingLeftRef.current,
    });
  });

  return (
    <pixiContainer
      x={renderState.x}
      y={renderState.y}
      zIndex={renderState.y}
      scale={{ x: renderState.facingLeft ? -1 : 1, y: 1 }}
    >
      <pixiGraphics draw={drawCallback} />
      {bubbleText && (
        <pixiContainer x={0} y={-35}>
          <pixiGraphics draw={drawCatBubble} />
          <pixiText
            text={bubbleText}
            anchor={0.5}
            x={0}
            y={-BUBBLE_H / 2}
            style={bubbleStyle}
            resolution={2}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
}

export const CatSprite = memo(CatSpriteComponent);
