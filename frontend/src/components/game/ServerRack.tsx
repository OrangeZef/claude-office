/**
 * ServerRack Component
 *
 * Procedurally drawn pixel-art server rack placed in the bottom-right
 * corner of the office (~52px wide × 90px tall).
 */

"use client";

import { memo, useCallback } from "react";
import { Graphics } from "pixi.js";

// ============================================================================
// TYPES
// ============================================================================

export interface ServerRackProps {
  x?: number;
  y?: number;
}

// ============================================================================
// DRAW FUNCTION
// ============================================================================

function drawServerRack(g: Graphics): void {
  g.clear();

  const W = 52;
  const H = 90;
  const TOP_H = 8; // depth of the top surface for 3D illusion

  // Subtle glow behind the rack
  g.roundRect(-2, -(TOP_H + 2), W + 4, H + TOP_H + 4, 4);
  g.fill({ color: 0x0033ff, alpha: 0.15 });

  // Top surface — gives depth illusion
  g.rect(0, -TOP_H, W, TOP_H);
  g.fill(0x2a2a40);
  g.stroke({ width: 1, color: 0x444466 });

  // Outer frame (front face)
  g.roundRect(0, 0, W, H, 3);
  g.fill(0x1a1a2e);
  g.stroke({ width: 2, color: 0x333355 });

  // Fan grille at top (3 thin parallel lines)
  const grillY = 4;
  for (let i = 0; i < 3; i++) {
    g.moveTo(8, grillY + i * 3);
    g.lineTo(W - 8, grillY + i * 3);
    g.stroke({ width: 1, color: 0x333355 });
  }

  // 4 rack-mounted server units
  const serverW = 44;
  const serverH = 10;
  const serverStartX = (W - serverW) / 2; // = 4
  const serverStartY = 16; // 6 below top (after grille area)
  const serverGap = 4;

  for (let i = 0; i < 4; i++) {
    const sy = serverStartY + i * (serverH + serverGap);

    // Server body
    g.rect(serverStartX, sy, serverW, serverH);
    g.fill(0x2d2d44);

    // Front label (thin rect)
    g.rect(serverStartX + 2, sy + 3, 20, 4);
    g.fill(0x3a3a55);

    // Vent slots on left (3 thin horizontal lines)
    for (let v = 0; v < 3; v++) {
      g.moveTo(serverStartX + 2, sy + 2 + v * 3);
      g.lineTo(serverStartX + 10, sy + 2 + v * 3);
      g.stroke({ width: 1, color: 0x1a1a2e });
    }

    // Status LEDs on right: green (active) + orange (warn)
    // LED 1 — green active
    g.circle(serverStartX + serverW - 8, sy + 4, 2);
    g.fill(0x00ff44);

    // LED 2 — orange warn
    g.circle(serverStartX + serverW - 4, sy + 4, 2);
    g.fill(0xff8800);
  }

  // Cable management area at bottom
  const cableY = serverStartY + 4 * (serverH + serverGap) + 2;
  const cableH = H - cableY - 4;

  g.rect(serverStartX, cableY, serverW, cableH);
  g.fill(0x12121f);

  // Colored cable dots
  const cableDots: { cx: number; color: number }[] = [
    { cx: serverStartX + 5, color: 0xff3333 },
    { cx: serverStartX + 12, color: 0x3399ff },
    { cx: serverStartX + 19, color: 0xffcc00 },
    { cx: serverStartX + 26, color: 0xff3333 },
    { cx: serverStartX + 33, color: 0x3399ff },
  ];
  for (const dot of cableDots) {
    g.circle(dot.cx, cableY + cableH / 2, 1.5);
    g.fill(dot.color);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

function ServerRackComponent({ x = 1160, y = 900 }: ServerRackProps) {
  const draw = useCallback((g: Graphics) => drawServerRack(g), []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

export const ServerRack = memo(ServerRackComponent);
