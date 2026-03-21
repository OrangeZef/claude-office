/**
 * WarningLight Component
 *
 * Wall-mounted warning light that flashes red when there is an active error.
 */

"use client";

import { memo, useRef, useCallback, useState } from "react";
import { useTick } from "@pixi/react";
import { Graphics } from "pixi.js";

// ============================================================================
// TYPES
// ============================================================================

export interface WarningLightProps {
  x: number;
  y: number;
  active: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

function WarningLightComponent({ x, y, active }: WarningLightProps) {
  const glowAlphaRef = useRef(0.2);
  const dirRef = useRef(1);
  const [glowAlpha, setGlowAlpha] = useState(0.2);

  useTick((ticker) => {
    if (!active) return;
    const dt = ticker.deltaTime / 60;
    glowAlphaRef.current += dirRef.current * dt * 0.8; // ~1Hz pulse
    if (glowAlphaRef.current >= 0.6) { glowAlphaRef.current = 0.6; dirRef.current = -1; }
    if (glowAlphaRef.current <= 0.2) { glowAlphaRef.current = 0.2; dirRef.current = 1; }
    setGlowAlpha(glowAlphaRef.current);
  });

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();

      // Mount bracket
      g.rect(-6, -3, 12, 6);
      g.fill(0x444444);

      // Outer glow ring (only when active)
      if (active) {
        g.circle(0, 0, 14);
        g.fill({ color: 0xff4400, alpha: glowAlpha });
      }

      // Light housing circle
      g.circle(0, 0, 10);
      g.fill(active ? 0xff2200 : 0x333333);
      g.stroke({ width: 1.5, color: 0x222222 });
    },
    [active, glowAlpha],
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

export const WarningLight = memo(WarningLightComponent);
