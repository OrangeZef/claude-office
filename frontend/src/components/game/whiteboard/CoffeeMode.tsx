"use client";

/**
 * TokenBudgetMode - Mode 9: Context window / token budget display.
 *
 * Shows a horizontal gauge bar for context utilization with color thresholds,
 * input/output token counts, and a small compaction (coffee cup) counter.
 */

import { Graphics } from "pixi.js";
import { useCallback, type ReactNode } from "react";
import type { WhiteboardData } from "@/types";
import { useGameStore } from "@/stores/gameStore";

export interface CoffeeModeProps {
  data: WhiteboardData;
}

export function CoffeeMode({ data }: CoffeeModeProps): ReactNode {
  const contextUtilization = useGameStore((s) => s.contextUtilization);
  const pct = Math.min(1, Math.max(0, contextUtilization));
  const pctDisplay = Math.round(pct * 100);

  const inputTokens = (data.totalInputTokens as number) ?? 0;
  const outputTokens = (data.totalOutputTokens as number) ?? 0;
  const compactionCount = data.coffeeCups ?? 0;

  // Determine gauge color based on utilization
  let gaugeColor: number;
  let gaugeColorHex: string;
  if (pct > 0.8) {
    gaugeColor = 0xef4444; // red
    gaugeColorHex = "#ef4444";
  } else if (pct > 0.5) {
    gaugeColor = 0xeab308; // gold/yellow
    gaugeColorHex = "#eab308";
  } else {
    gaugeColor = 0x22c55e; // green
    gaugeColorHex = "#22c55e";
  }

  // Gauge dimensions
  const gaugeX = 30;
  const gaugeY = 35;
  const gaugeW = 270;
  const gaugeH = 22;

  const drawGauge = useCallback(
    (g: Graphics) => {
      g.clear();
      // Background bar (dark)
      g.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 4);
      g.fill(0x1a1a2e);
      g.stroke({ width: 1, color: 0x333355 });

      // Filled bar (colored based on utilization)
      if (pct > 0) {
        const fillW = Math.max(4, gaugeW * pct);
        g.roundRect(gaugeX, gaugeY, fillW, gaugeH, 4);
        g.fill(gaugeColor);
      }

      // Threshold markers at 50% and 80%
      const mark50 = gaugeX + gaugeW * 0.5;
      const mark80 = gaugeX + gaugeW * 0.8;
      g.moveTo(mark50, gaugeY);
      g.lineTo(mark50, gaugeY + gaugeH);
      g.stroke({ width: 1, color: 0x555577, alpha: 0.5 });
      g.moveTo(mark80, gaugeY);
      g.lineTo(mark80, gaugeY + gaugeH);
      g.stroke({ width: 1, color: 0x555577, alpha: 0.5 });
    },
    [pct, gaugeColor],
  );

  // Format token count for display (e.g. 1234567 -> "1.23M", 12345 -> "12.3K")
  const formatTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <pixiContainer>
      {/* Title */}
      <pixiText
        text="CONTEXT"
        x={165}
        y={5}
        anchor={0.5}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          fontWeight: "bold",
          fill: "#e2e8f0",
        }}
        resolution={2}
      />

      {/* Utilization percentage */}
      <pixiText
        text={`${pctDisplay}%`}
        x={165}
        y={22}
        anchor={0.5}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          fontWeight: "bold",
          fill: gaugeColorHex,
        }}
        resolution={2}
      />

      {/* Gauge bar */}
      <pixiGraphics draw={drawGauge} />

      {/* Input tokens */}
      <pixiText
        text={`IN: ${formatTokens(inputTokens)}`}
        x={80}
        y={70}
        anchor={0.5}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 10,
          fill: "#94a3b8",
        }}
        resolution={2}
      />

      {/* Output tokens */}
      <pixiText
        text={`OUT: ${formatTokens(outputTokens)}`}
        x={250}
        y={70}
        anchor={0.5}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 10,
          fill: "#94a3b8",
        }}
        resolution={2}
      />

      {/* Compaction count - small bottom-right detail */}
      <pixiText
        text={`\u2615 ${compactionCount}`}
        x={290}
        y={90}
        anchor={{ x: 1, y: 0 }}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 9,
          fill: "#78350f",
        }}
        resolution={2}
      />
    </pixiContainer>
  );
}
