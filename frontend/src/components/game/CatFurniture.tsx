/**
 * CatFurniture Component
 *
 * Renders a cat bed and cat tree as procedural PixiJS Graphics.
 * No image files needed — everything is drawn with primitives.
 */

"use client";

import { memo, useCallback } from "react";
import { Graphics } from "pixi.js";

// ============================================================================
// CONSTANTS
// ============================================================================

// Cat bed colors
const BED_BASE_COLOR = 0x8b4513;
const BED_BASE_BORDER = 0x6b3410;
const BED_CUSHION_COLOR = 0xe8c090;
const BED_BUMPER_COLOR = 0xc47a3a;

// Cat tree colors
const TREE_BASE_COLOR = 0x8b6914;
const TREE_POLE_COLOR = 0xd2691e;
const TREE_ROPE_COLOR = 0xc4a060;
const TREE_PLATFORM_COLOR = 0x8b6914;
const TREE_PLATFORM_DARK = 0x6b5010;

// Positions
const BED_X = 1130;
const BED_Y = 840;

const TREE_X = 140;
const TREE_Y = 760;

// ============================================================================
// DRAW FUNCTIONS
// ============================================================================

function drawCatBed(g: Graphics): void {
  g.clear();

  // Oval base
  g.ellipse(0, 0, 25, 14);
  g.fill(BED_BASE_COLOR);
  g.stroke({ width: 1.5, color: BED_BASE_BORDER });

  // Cushion (inset oval)
  g.ellipse(0, 0, 21, 10);
  g.fill(BED_CUSHION_COLOR);

  // Cushion texture lines (subtle)
  g.moveTo(-14, -2);
  g.bezierCurveTo(-7, -5, 7, -5, 14, -2);
  g.stroke({ width: 1, color: 0xd0a870, alpha: 0.5 });

  g.moveTo(-14, 2);
  g.bezierCurveTo(-7, 5, 7, 5, 14, 2);
  g.stroke({ width: 1, color: 0xd0a870, alpha: 0.5 });

  // Left side bumper (arc)
  g.moveTo(-21, -6);
  g.quadraticCurveTo(-28, 0, -21, 6);
  g.stroke({ width: 4, color: BED_BUMPER_COLOR, cap: "round" });

  // Right side bumper (arc)
  g.moveTo(21, -6);
  g.quadraticCurveTo(28, 0, 21, 6);
  g.stroke({ width: 4, color: BED_BUMPER_COLOR, cap: "round" });
}

function drawCatTree(g: Graphics): void {
  g.clear();

  // All positioned relative to anchor = center-bottom
  // Total height ~ 68px, so top is at y=-68
  const treeH = 68;

  // Base platform (50x8px centered, at bottom)
  g.rect(-25, -8, 50, 8);
  g.fill(TREE_BASE_COLOR);
  g.stroke({ width: 1, color: TREE_PLATFORM_DARK });

  // Center pole (10x60px, sitting on base)
  g.rect(-5, -treeH, 10, treeH - 8);
  g.fill(TREE_POLE_COLOR);

  // Rope texture on pole — horizontal lines every 8px
  for (let ry = -treeH + 6; ry < -10; ry += 8) {
    g.moveTo(-5, ry);
    g.lineTo(5, ry);
    g.stroke({ width: 1.5, color: TREE_ROPE_COLOR, alpha: 0.8 });
  }

  // Top platform (44x8px centered on pole top)
  g.rect(-22, -treeH - 4, 44, 8);
  g.fill(TREE_PLATFORM_COLOR);
  g.stroke({ width: 1, color: TREE_PLATFORM_DARK });

  // Platform top surface highlight
  g.moveTo(-22, -treeH - 4);
  g.lineTo(22, -treeH - 4);
  g.stroke({ width: 1, color: 0xd4a830, alpha: 0.6 });

  // Small mouse toy hanging from right side of top platform
  // String
  g.moveTo(16, -treeH + 4);
  g.lineTo(14, -treeH + 14);
  g.stroke({ width: 1, color: 0x888888 });

  // Mouse body (circle)
  g.circle(14, -treeH + 18, 4);
  g.fill(0x999999);

  // Mouse ear
  g.circle(11, -treeH + 15, 2);
  g.fill(0xbbbbbb);

  // Mouse eye (tiny)
  g.circle(12, -treeH + 17, 0.8);
  g.fill(0x333333);

  // Mouse tail
  g.moveTo(18, -treeH + 19);
  g.quadraticCurveTo(22, -treeH + 22, 20, -treeH + 26);
  g.stroke({ width: 1, color: 0x888888, cap: "round" });
}

// ============================================================================
// COMPONENTS
// ============================================================================

function CatBedComponent({ x, y }: { x: number; y: number }) {
  const draw = useCallback((g: Graphics) => drawCatBed(g), []);
  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

function CatTreeComponent({ x, y }: { x: number; y: number }) {
  const draw = useCallback((g: Graphics) => drawCatTree(g), []);
  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

function CatFurnitureComponent() {
  return (
    <>
      <CatBedComponent x={BED_X} y={BED_Y} />
      <CatTreeComponent x={TREE_X} y={TREE_Y} />
    </>
  );
}

export const CatFurniture = memo(CatFurnitureComponent);
export const CatBed = memo(CatBedComponent);
export const CatTree = memo(CatTreeComponent);
