/**
 * CatFoodArea Component
 *
 * Procedurally drawn cat food and water bowls placed below the city window.
 */

"use client";

import { memo, useCallback } from "react";
import { Graphics } from "pixi.js";

const EMOJI_TEXT_STYLE = {
  fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
  fontSize: 10,
} as const;

// ============================================================================
// DRAW FUNCTIONS
// ============================================================================

function drawCatFoodArea(g: Graphics): void {
  g.clear();

  // Red placemat (drawn first, behind bowls)
  g.roundRect(-4, -4, 55, 16, 2);
  g.fill(0xcc4422);

  // ---- Water bowl (left) ----
  const wBowlX = 0;
  const bowlW = 20;
  const bowlH = 8;
  const bowlY = 0;

  // Metal bowl
  g.roundRect(wBowlX, bowlY, bowlW, bowlH, 3);
  g.fill(0x888888);
  g.stroke({ width: 1, color: 0x555555 });

  // Water fill (slightly smaller, inside bowl)
  g.roundRect(wBowlX + 2, bowlY + 2, bowlW - 4, bowlH - 4, 2);
  g.fill({ color: 0x4488ff, alpha: 0.8 });

  // ---- Food bowl (right, x+28) ----
  const fBowlX = wBowlX + 28;

  // Metal bowl
  g.roundRect(fBowlX, bowlY, bowlW, bowlH, 3);
  g.fill(0x888888);
  g.stroke({ width: 1, color: 0x555555 });

  // Kibble dots (3 circles inside bowl)
  const kibblePositions = [
    { x: fBowlX + 5, y: bowlY + 4 },
    { x: fBowlX + 10, y: bowlY + 3 },
    { x: fBowlX + 15, y: bowlY + 4 },
  ];
  for (const kp of kibblePositions) {
    g.circle(kp.x, kp.y, 2);
    g.fill(0xcc8844);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface CatFoodAreaProps {
  x?: number;
  y?: number;
}

function CatFoodAreaComponent({ x = 320, y = 300 }: CatFoodAreaProps) {
  const draw = useCallback((g: Graphics) => drawCatFoodArea(g), []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
      {/* Water label */}
      <pixiContainer x={10} y={-8} scale={0.5}>
        <pixiText text="💧" anchor={0.5} style={EMOJI_TEXT_STYLE} resolution={2} />
      </pixiContainer>
      {/* Food label */}
      <pixiContainer x={38} y={-8} scale={0.5}>
        <pixiText text="🐟" anchor={0.5} style={EMOJI_TEXT_STYLE} resolution={2} />
      </pixiContainer>
    </pixiContainer>
  );
}

export const CatFoodArea = memo(CatFoodAreaComponent);
