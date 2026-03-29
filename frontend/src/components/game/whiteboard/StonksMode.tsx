"use client";

/**
 * StonksMode - Mode 4: Productivity stock tickers with real-data sparklines.
 *
 * Displays four pseudo-stock symbols based on session metrics, with animated
 * price display and mini sparkline charts driven by rolling history of actual
 * metric values.
 */

import { Graphics } from "pixi.js";
import { useState, useEffect, type ReactNode } from "react";
import type { WhiteboardData } from "@/types";

export interface StonksModeProps {
  data: WhiteboardData;
}

const HISTORY_LENGTH = 10;

interface RollingHistory {
  task: number[];
  bug: number[];
  cafe: number[];
  code: number[];
}

function pushValue(arr: number[], value: number): number[] {
  const next = [...arr, value];
  if (next.length > HISTORY_LENGTH) next.shift();
  return next;
}

export function StonksMode({ data }: StonksModeProps): ReactNode {
  const [history, setHistory] = useState<RollingHistory>({
    task: [],
    bug: [],
    cafe: [],
    code: [],
  });

  const taskCompletedCount = data.taskCompletedCount ?? 0;
  const bugFixedCount = data.bugFixedCount ?? 0;
  const coffeeBreakCount = data.coffeeBreakCount ?? 0;
  const codeWrittenCount = data.codeWrittenCount ?? 0;

  // Snapshot metrics into history every 2 seconds.
  // The interval re-creates when metric values change, ensuring we always
  // capture the latest values without accessing refs during render.
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => ({
        task: pushValue(prev.task, taskCompletedCount),
        bug: pushValue(prev.bug, bugFixedCount),
        cafe: pushValue(prev.cafe, coffeeBreakCount),
        code: pushValue(prev.code, codeWrittenCount),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [taskCompletedCount, bugFixedCount, coffeeBreakCount, codeWrittenCount]);

  // Compute tool usage total for price display
  const toolTotal = Object.values(data.toolUsage ?? {}).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );

  // Determine trend: compare last two values in history
  const isUp = (arr: number[], fallback: boolean): boolean => {
    if (arr.length >= 2) return arr[arr.length - 1] >= arr[arr.length - 2];
    return fallback;
  };

  const stocks = [
    {
      symbol: "$TASK",
      price: (taskCompletedCount * 10 + 1).toFixed(2),
      up: isUp(history.task, taskCompletedCount > 0),
      history: history.task,
    },
    {
      symbol: "$BUG",
      price: (bugFixedCount * 10 + 1).toFixed(2),
      up: isUp(history.bug, bugFixedCount > 0),
      history: history.bug,
    },
    {
      symbol: "$CAFE",
      price: (coffeeBreakCount * 10 + 1).toFixed(2),
      up: isUp(history.cafe, coffeeBreakCount > 0),
      history: history.cafe,
    },
    {
      symbol: "$CODE",
      price: (codeWrittenCount * 10 + toolTotal).toFixed(2),
      up: isUp(history.code, codeWrittenCount > 0),
      history: history.code,
    },
  ];

  return (
    <pixiContainer>
      {stocks.map((stock, i) => (
        <pixiContainer key={stock.symbol} y={i * 27}>
          <pixiText
            text={stock.symbol}
            x={16}
            y={3}
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 12,
              fontWeight: "bold",
              fill: "#1f2937",
            }}
            resolution={2}
          />
          <pixiText
            text={stock.up ? "\u25B2" : "\u25BC"}
            x={85}
            y={3}
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 12,
              fill: stock.up ? "#22c55e" : "#ef4444",
            }}
            resolution={2}
          />
          <pixiText
            text={stock.price}
            x={100}
            y={3}
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 12,
              fill: stock.up ? "#22c55e" : "#ef4444",
            }}
            resolution={2}
          />
          {/* Mini sparkline from real rolling history */}
          <pixiGraphics
            x={170}
            y={8}
            draw={(g: Graphics) => {
              g.clear();
              const hist = stock.history;
              if (hist.length < 2) {
                // Not enough data - draw flat line
                g.moveTo(0, 5);
                g.lineTo(70, 5);
                g.stroke({ width: 1, color: 0x9ca3af });
                return;
              }
              const min = Math.min(...hist);
              const max = Math.max(...hist);
              const range = max - min || 1;
              const stepX = 70 / (hist.length - 1);
              const height = 10;
              g.moveTo(0, height - ((hist[0] - min) / range) * height);
              for (let j = 1; j < hist.length; j++) {
                const y = height - ((hist[j] - min) / range) * height;
                g.lineTo(j * stepX, y);
              }
              g.stroke({ width: 1, color: stock.up ? 0x22c55e : 0xef4444 });
            }}
          />
        </pixiContainer>
      ))}
    </pixiContainer>
  );
}
