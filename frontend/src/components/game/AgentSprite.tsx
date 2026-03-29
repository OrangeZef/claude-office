/**
 * AgentSprite Component
 *
 * Renders a single agent character as a colored capsule with optional bubble.
 * Supports headset and sunglasses accessories.
 */

"use client";

import { memo, useMemo, useState, useCallback, useRef, type ReactNode } from "react";
import { useTick } from "@pixi/react";
import { Graphics, TextStyle, Texture } from "pixi.js";
import type { Position, BubbleContent } from "@/types";
import type { AgentPhase } from "@/stores/gameStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { isInElevatorZone } from "@/systems/queuePositions";
import { ICON_MAP } from "./shared/iconMap";
import { drawBubble, drawIconBadge } from "./shared/drawBubble";

// ============================================================================
// TYPES
// ============================================================================

export interface AgentSpriteProps {
  id: string;
  name: string | null;
  color: string;
  number: number;
  position: Position;
  phase: AgentPhase;
  bubble: BubbleContent | null;
  headsetTexture?: Texture | null;
  sunglassesTexture?: Texture | null;
  animeTexture?: Texture | null;
  animeFrames?: Texture[];
  workerVariants?: Texture[][];
  variantIndex?: number;
  renderBubble?: boolean; // Whether to render bubble (default true)
  renderLabel?: boolean; // Whether to render name label (default true)
  isTyping?: boolean; // Whether agent is typing (animates arms)
  backendState?: string; // Backend state for visual indicators (e.g. "waiting_permission")
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AGENT_WIDTH = 48; // 1.5 blocks × 32px (matches boss)
const AGENT_HEIGHT = 80; // 2.5 blocks × 32px (matches boss)
const STROKE_WIDTH = 4;

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function drawAgent(g: Graphics, color: string): void {
  g.clear();

  // Convert hex color string to number
  const colorNum = parseInt(color.replace("#", ""), 16) || 0xff6b6b;

  // Agent body (colored capsule with white border)
  // Position is at CENTER OF BOTTOM CIRCLE, so capsule extends from -54 to +22
  // Inset by half stroke width so total size matches AGENT_WIDTH × AGENT_HEIGHT
  const innerWidth = AGENT_WIDTH - STROKE_WIDTH;
  const innerHeight = AGENT_HEIGHT - STROKE_WIDTH;
  const agentRadius = innerWidth / 2; // 22px - radius of top/bottom circles
  g.roundRect(
    -innerWidth / 2,
    -innerHeight + agentRadius, // Bottom circle center at y=0
    innerWidth,
    innerHeight,
    agentRadius,
  );
  g.fill(colorNum);
  g.stroke({ width: STROKE_WIDTH, color: 0xffffff });
}

// ============================================================================
// BUBBLE COMPONENT
// ============================================================================

interface BubbleProps {
  content: BubbleContent;
  yOffset: number;
}

function Bubble({ content, yOffset }: BubbleProps): ReactNode {
  const { text, type = "thought", icon } = content;

  // Convert icon name to emoji if needed
  const iconEmoji = icon ? (ICON_MAP[icon] ?? icon) : undefined;

  // Icon badge constants
  const badgeRadius = 16; // Radius of the circular badge

  // Calculate bubble dimensions (at display scale) - icon is outside bubble now
  const charWidth = 7.5;
  const paddingH = 30;
  const maxW = 220;
  const rawWidth = text.length * charWidth + paddingH;
  const bWidth = Math.min(maxW, Math.max(80, rawWidth));
  const capacity = (bWidth - paddingH) / charWidth;
  const lines = Math.max(1, Math.ceil(text.length / capacity));
  const bHeight = 35 + lines * 14;

  // Text style at 2x for sharp rendering
  const textStyle = useMemo<Partial<TextStyle>>(
    () => ({
      fontFamily:
        '"Courier New", Courier, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace',
      fontSize: 26,
      fill: "#000000",
      fontWeight: "bold",
      wordWrap: true,
      wordWrapWidth: (bWidth - 30) * 2,
      breakWords: true,
      align: "left",
      lineHeight: 28,
      stroke: { width: 0, color: 0x000000 },
    }),
    [bWidth],
  );

  // Icon style - larger emoji
  const iconStyle = useMemo<Partial<TextStyle>>(
    () => ({
      fontFamily:
        '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontSize: 40, // Large emoji for badge
      fill: "#000000",
    }),
    [],
  );

  return (
    <pixiContainer y={yOffset} x={45}>
      <pixiGraphics draw={(g) => drawBubble(g, bWidth, bHeight, type)} />
      {/* Icon badge on top-left corner of bubble */}
      {iconEmoji && (
        <pixiContainer x={-bWidth / 2 - 6} y={-bHeight + 6}>
          <pixiGraphics draw={(g) => drawIconBadge(g, badgeRadius)} />
          <pixiContainer scale={0.5} x={0} y={1}>
            <pixiText
              text={iconEmoji}
              anchor={0.5}
              style={iconStyle}
              resolution={2}
            />
          </pixiContainer>
        </pixiContainer>
      )}
      {/* Text rendered at 2x and scaled down for sharpness */}
      <pixiContainer x={-bWidth / 2 + 15} y={-bHeight / 2} scale={0.5}>
        <pixiText
          text={text}
          anchor={{ x: 0, y: 0.5 }}
          style={textStyle}
          resolution={2}
        />
      </pixiContainer>
    </pixiContainer>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AgentSpriteComponent({
  id: _id,
  name,
  color,
  number: _number,
  position,
  phase: _phase,
  bubble,
  headsetTexture: _headsetTexture,
  sunglassesTexture,
  animeTexture,
  animeFrames,
  workerVariants,
  variantIndex = 0,
  renderBubble = true,
  renderLabel = true,
  isTyping = false,
  backendState,
}: AgentSpriteProps): ReactNode {
  // Memoize draw callback (fallback only)
  const drawCallback = useMemo(
    () => (g: Graphics) => drawAgent(g, color),
    [color],
  );

  // Frame animation state for sprite sheet cycling
  const [frameIndex, setFrameIndex] = useState(0);

  // Animate magic sparkle — cycles through frames when typing
  const [sparkleFrame, setSparkleFrame] = useState(0);

  // Pulsing indicator for waiting_permission state
  const [permissionPulse, setPermissionPulse] = useState(0);

  // Resolve which frame array to use: workerVariants takes priority over animeFrames
  const resolvedFrames: Texture[] | undefined =
    workerVariants && workerVariants.length > 0
      ? workerVariants[variantIndex % workerVariants.length]
      : animeFrames;

  // Animation speed from preferences
  const animationSpeed = usePreferencesStore((s) => s.animationSpeed);
  const speedMultiplier = animationSpeed === "slow" ? 0.5 : animationSpeed === "fast" ? 2.0 : 1.0;

  // Stable refs for tick callback dependencies
  const resolvedFramesRef = useRef(resolvedFrames);
  resolvedFramesRef.current = resolvedFrames;
  const isTypingRef = useRef(isTyping);
  isTypingRef.current = isTyping;
  const backendStateRef = useRef(backendState);
  backendStateRef.current = backendState;
  const speedMultiplierRef = useRef(speedMultiplier);
  speedMultiplierRef.current = speedMultiplier;

  const tickCallback = useCallback((ticker: { deltaTime: number }) => {
    const frames = resolvedFramesRef.current;
    const typing = isTypingRef.current;
    const bState = backendStateRef.current;
    const speed = speedMultiplierRef.current;

    // Early return if no animations need updating
    const hasFrameAnim = frames && frames.length > 1;
    const hasSparkle = typing;
    const hasPermission = bState === "waiting_permission";
    if (!hasFrameAnim && !hasSparkle && !hasPermission) return;

    if (hasFrameAnim) {
      setFrameIndex((f) => (f + ticker.deltaTime * 0.12 * speed) % frames.length);
    }
    if (hasSparkle) {
      setSparkleFrame((f) => (f + ticker.deltaTime * 0.18 * speed) % 4);
    }
    if (hasPermission) {
      setPermissionPulse((p) => p + ticker.deltaTime * 0.08 * speed);
    }
  }, []);

  useTick(tickCallback);

  const activeTexture =
    resolvedFrames && resolvedFrames.length > 0
      ? resolvedFrames[Math.floor(frameIndex) % resolvedFrames.length]
      : animeTexture;
  const sparkleEmoji = ["✨", "💫", "⚡", "💥"][Math.floor(sparkleFrame)];

  // Bubble offset — shifted up so it clears the name label
  const bubbleOffset = -113;

  return (
    <pixiContainer x={position.x} y={position.y}>
      {/* Drop shadow */}
      <pixiGraphics draw={(g: Graphics) => {
        g.clear();
        g.ellipse(0, 0, 20, 6);
        g.fill({ color: 0x000000, alpha: 0.25 });
      }} />

      {/* Agent body — anime sprite if available, else colored capsule */}
      {activeTexture ? (
        <pixiSprite
          texture={activeTexture}
          anchor={{ x: 0.5, y: 1 }}
          x={0}
          y={0}
          scale={{ x: (AGENT_WIDTH * 2.1) / 384, y: (AGENT_HEIGHT * 2.1) / 640 }}
        />
      ) : (
        <pixiGraphics draw={drawCallback} />
      )}

      {/* Sunglasses (capsule fallback only) */}
      {!activeTexture && sunglassesTexture && (
        <pixiSprite
          texture={sunglassesTexture}
          anchor={0.5}
          x={0}
          y={-37}
          scale={{ x: 0.036, y: 0.04 }}
        />
      )}

      {/* Magic sparkle when working — replaces headset for anime sprites */}
      {activeTexture && isTyping && !isInElevatorZone(position) && (
        <pixiContainer x={28} y={-120} scale={0.6}>
          <pixiText
            text={sparkleEmoji}
            anchor={0.5}
            style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', fontSize: 36 }}
            resolution={2}
          />
        </pixiContainer>
      )}

      {/* Agent name if present - hide when in elevator or when renderLabel is false */}
      {renderLabel && name && !isInElevatorZone(position) && (
        <pixiContainer y={-155} scale={0.5}>
          <pixiText
            text={name}
            anchor={0.5}
            style={{
              fontFamily: "monospace",
              fontSize: 24,
              fill: 0xffffff,
              fontWeight: "bold",
              stroke: { width: 4, color: 0x000000 },
            }}
            resolution={2}
          />
        </pixiContainer>
      )}

      {/* Waiting permission indicator - pulsing gold exclamation mark */}
      {backendState === "waiting_permission" && !isInElevatorZone(position) && (
        <pixiGraphics
          x={0}
          y={-130}
          alpha={0.3 + Math.abs(Math.sin(permissionPulse)) * 0.7}
          draw={(g: Graphics) => {
            g.clear();
            // Gold circle background
            g.circle(0, 0, 10);
            g.fill({ color: 0xeab308, alpha: 0.3 });
            // Exclamation mark stem
            g.roundRect(-2, -7, 4, 9, 1);
            g.fill(0xeab308);
            // Exclamation mark dot
            g.circle(0, 6, 2);
            g.fill(0xeab308);
          }}
        />
      )}

      {/* Bubble - hide when in elevator or when renderBubble is false */}
      {renderBubble && bubble && !isInElevatorZone(position) && (
        <Bubble content={bubble} yOffset={bubbleOffset} />
      )}
    </pixiContainer>
  );
}

// ============================================================================
// AGENT ARMS COMPONENT (rendered separately after desk surfaces)
// ============================================================================

export interface AgentArmsProps {
  position: Position;
  isTyping: boolean;
}

function AgentArmsComponent({ position, isTyping }: AgentArmsProps): ReactNode {
  // Animation state for typing
  const [typingTime, setTypingTime] = useState(0);

  // Animate typing - oscillate hands up/down
  useTick((ticker) => {
    if (isTyping) {
      setTypingTime((t) => t + ticker.deltaTime * 0.15);
    } else {
      setTypingTime(0);
    }
  });

  // Calculate arm animation offsets (subtle, out of phase for natural look)
  const rightArmOffset = isTyping ? Math.sin(typingTime * 8) * 2 : 0;
  const leftArmOffset = isTyping
    ? Math.sin(typingTime * 8 + Math.PI * 0.7) * 2
    : 0;

  // Orb draw callbacks — glowing floating orbs instead of stick arms
  const drawRightArmCallback = useCallback(
    (g: Graphics) => {
      g.clear();
      const animOffset = rightArmOffset;
      const cx = 22;
      const cy = -16 + animOffset;
      // Outer glow
      g.circle(cx, cy, 8);
      g.fill({ color: 0x88aaff, alpha: 0.3 });
      // Inner orb
      g.circle(cx, cy, 5);
      g.fill({ color: 0x88aaff, alpha: isTyping ? 1.0 : 0.3 });
    },
    [rightArmOffset, isTyping],
  );

  const drawLeftArmCallback = useCallback(
    (g: Graphics) => {
      g.clear();
      const animOffset = leftArmOffset;
      const cx = -22;
      const cy = -16 + animOffset;
      // Outer glow
      g.circle(cx, cy, 8);
      g.fill({ color: 0x88aaff, alpha: 0.3 });
      // Inner orb
      g.circle(cx, cy, 5);
      g.fill({ color: 0x88aaff, alpha: isTyping ? 1.0 : 0.3 });
    },
    [leftArmOffset, isTyping],
  );

  return (
    <pixiContainer x={position.x} y={position.y}>
      <pixiGraphics draw={drawRightArmCallback} />
      <pixiGraphics draw={drawLeftArmCallback} />
    </pixiContainer>
  );
}

export const AgentArms = memo(AgentArmsComponent);

// ============================================================================
// AGENT HEADSET COMPONENT (rendered after arms for correct z-order)
// ============================================================================

export interface AgentHeadsetProps {
  position: Position;
  headsetTexture: Texture;
}

function AgentHeadsetComponent({
  position,
  headsetTexture,
}: AgentHeadsetProps): ReactNode {
  return (
    <pixiSprite
      texture={headsetTexture}
      anchor={0.5}
      x={position.x}
      y={position.y - 38}
      scale={{ x: 0.66825, y: 0.675 }}
    />
  );
}

export const AgentHeadset = memo(AgentHeadsetComponent);

// ============================================================================
// AGENT LABEL COMPONENT (rendered separately for z-ordering)
// ============================================================================

export interface AgentLabelProps {
  name: string;
  position: Position;
}

function AgentLabelComponent({ name, position }: AgentLabelProps): ReactNode {
  return (
    <pixiContainer x={position.x} y={position.y - 175} scale={0.5}>
      <pixiText
        text={name}
        anchor={0.5}
        style={{
          fontFamily: "monospace",
          fontSize: 24,
          fill: 0xffffff,
          fontWeight: "bold",
          stroke: { width: 4, color: 0x000000 },
        }}
        resolution={2}
      />
    </pixiContainer>
  );
}

export const AgentLabel = memo(AgentLabelComponent);

export const AgentSprite = memo(AgentSpriteComponent);

// Export Bubble component for use in top-level bubbles layer
export { Bubble };
