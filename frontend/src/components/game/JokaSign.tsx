/**
 * JokaSign Component
 *
 * Procedurally drawn wall sign displaying "JOKA.CA / AI MANAGED",
 * placed above the elevator on the back wall.
 * ~110px wide × 50px tall.
 */

"use client";

import { memo, useCallback, useMemo } from "react";
import { Graphics, TextStyle } from "pixi.js";

// ============================================================================
// TYPES
// ============================================================================

export interface JokaSignProps {
  x: number;
  y: number;
}

// ============================================================================
// DRAW FUNCTION
// ============================================================================

function drawSignBacking(g: Graphics): void {
  g.clear();

  const W = 110;
  const H = 50;
  // Subtle blue glow behind sign
  g.roundRect(-3, -3, W + 6, H + 6, 6);
  g.fill({ color: 0x0033ff, alpha: 0.15 });

  // Main sign backing
  g.roundRect(0, 0, W, H, 4);
  g.fill(0x0a0a1a);
  g.stroke({ width: 2, color: 0xffd700 });

  // Inner gold border (inset 3px)
  g.roundRect(3, 3, W - 6, H - 6, 3);
  g.stroke({ width: 1, color: 0xffd700, alpha: 0.4 });

  // Left vertical gold decoration
  g.rect(6, 10, 1, 30);
  g.fill(0xffd700);

  // Right vertical gold decoration
  g.rect(W - 7, 10, 1, 30);
  g.fill(0xffd700);

  // Dividing line between top and bottom text halves
  g.moveTo(10, H / 2 + 2);
  g.lineTo(W - 10, H / 2 + 2);
  g.stroke({ width: 0.5, color: 0xffd700, alpha: 0.3 });

}

// ============================================================================
// COMPONENT
// ============================================================================

function JokaSignComponent({ x, y }: JokaSignProps) {
  const draw = useCallback((g: Graphics) => drawSignBacking(g), []);

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "monospace",
        fontSize: 28, // rendered 2x, scaled 0.5 → 14px effective
        fontWeight: "bold",
        fill: 0xffd700,
        align: "center",
      }),
    [],
  );

  const subtitleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "monospace",
        fontSize: 16, // rendered 2x, scaled 0.5 → 8px effective
        fill: 0x8888aa,
        align: "center",
        fontStyle: "italic",
      }),
    [],
  );

  return (
    <pixiContainer x={x} y={y}>
      {/* Sign backing with border and decorations */}
      <pixiGraphics draw={draw} />

      {/* "JOKA.CA" — top half, centered (2x scale → 0.5 for crisp text) */}
      <pixiText
        text="JOKA.CA"
        anchor={0.5}
        x={55}
        y={17}
        scale={0.5}
        style={titleStyle}
      />

      {/* "AI MANAGED" — bottom half, centered */}
      <pixiText
        text="AI MANAGED"
        anchor={0.5}
        x={55}
        y={37}
        scale={0.5}
        style={subtitleStyle}
      />
    </pixiContainer>
  );
}

export const JokaSign = memo(JokaSignComponent);
