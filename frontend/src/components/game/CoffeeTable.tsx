/**
 * CoffeeTable Component
 *
 * Procedurally drawn small wooden table placed under the coffee machine.
 */

"use client";

import { memo, useCallback } from "react";
import { Graphics } from "pixi.js";

// ============================================================================
// DRAW FUNCTION
// ============================================================================

function drawCoffeeTable(g: Graphics): void {
  g.clear();

  const tableW = 55;
  const topH = 6;
  const faceH = 10;
  const legW = 6;
  const legH = 20;

  // Two legs (behind front face — draw first)
  g.rect(2, topH + faceH, legW, legH);
  g.fill(0x5a3e0a);
  g.rect(tableW - 2 - legW, topH + faceH, legW, legH);
  g.fill(0x5a3e0a);

  // Front face (vertical face of tabletop)
  g.rect(0, topH, tableW, faceH);
  g.fill(0x6b4f10);

  // Top surface
  g.rect(0, 0, tableW, topH);
  g.fill(0x8b6914);
}

// ============================================================================
// COMPONENT
// ============================================================================

interface CoffeeTableProps {
  x?: number;
  y?: number;
}

function CoffeeTableComponent({ x = 1054, y = 215 }: CoffeeTableProps) {
  const draw = useCallback((g: Graphics) => drawCoffeeTable(g), []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

export const CoffeeTable = memo(CoffeeTableComponent);
