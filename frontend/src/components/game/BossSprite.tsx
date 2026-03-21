/**
 * BossSprite Component
 *
 * Renders the boss character at their desk with state-based coloring.
 * Uses sprites for desk, chair, keyboard, monitor, and phone like agent desks.
 */

"use client";

import { memo, useMemo, useState, useCallback, type ReactNode } from "react";
import { useTick } from "@pixi/react";
import { Graphics, TextStyle, Texture } from "pixi.js";
import type { BossState, BubbleContent, Position } from "@/types";
import { MarqueeText } from "./MarqueeText";
import { ICON_MAP } from "./shared/iconMap";
import { drawBubble, drawIconBadge } from "./shared/drawBubble";
import { drawRightArm, drawLeftArm } from "./shared/drawArm";

// ============================================================================
// TYPES
// ============================================================================

export interface BossSpriteProps {
  position: Position;
  state: BossState;
  bubble: BubbleContent | null;
  inUseBy: "arrival" | "departure" | null;
  currentTask: string | null;
  chairTexture: Texture | null;
  deskTexture: Texture | null;
  keyboardTexture: Texture | null;
  monitorTexture: Texture | null;
  phoneTexture: Texture | null;
  headsetTexture?: Texture | null;
  sunglassesTexture: Texture | null;
  animeTexture?: Texture | null;
  animeFrames?: Texture[];
  renderBubble?: boolean; // Whether to render bubble (default true)
  isTyping?: boolean; // Whether boss is typing (animates arms)
  isAway?: boolean; // Whether boss is away from desk (hides body, shows only furniture)
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BOSS_WIDTH = 48; // 1.5 blocks × 32px
const BOSS_HEIGHT = 80; // 2.5 blocks × 32px
const STROKE_WIDTH = 4;

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function drawBossBody(g: Graphics, _state: BossState): void {
  g.clear();
  // Boss body (black capsule - state color changes were distracting)
  // Inset by half stroke width so total size matches BOSS_WIDTH × BOSS_HEIGHT
  const innerWidth = BOSS_WIDTH - STROKE_WIDTH;
  const innerHeight = BOSS_HEIGHT - STROKE_WIDTH;
  const bossRadius = innerWidth / 2;
  g.roundRect(
    -innerWidth / 2,
    -innerHeight / 2,
    innerWidth,
    innerHeight,
    bossRadius,
  );
  g.fill(0x1f2937); // Always dark gray
  g.stroke({ width: STROKE_WIDTH, color: 0xffffff });
}

function drawFallbackChair(g: Graphics): void {
  g.clear();
  g.circle(0, 15, 25);
  g.fill(0x4a5568);
  g.stroke({ width: 2, color: 0x2d3748 });
}

function drawFallbackDesk(g: Graphics): void {
  g.clear();
  g.rect(-70, 15, 140, 80);
  g.fill(0x5d3a1e);
  g.stroke({ width: 4, color: 0x3d2a1e });
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

function BossSpriteComponent({
  position,
  state,
  bubble,
  inUseBy: _inUseBy,
  currentTask,
  chairTexture,
  deskTexture,
  keyboardTexture,
  monitorTexture,
  phoneTexture: _phoneTexture,
  headsetTexture,
  sunglassesTexture,
  animeTexture,
  animeFrames,
  renderBubble = true,
  isTyping = false,
  isAway = false,
}: BossSpriteProps): ReactNode {
  // Frame animation state for sprite sheet cycling
  const [frameIndex, setFrameIndex] = useState(0);

  // Animation state for typing
  const [typingTime, setTypingTime] = useState(0);

  // Animate typing - oscillate hands up/down; also advance frame cycling
  useTick((ticker) => {
    if (animeFrames && animeFrames.length > 1) {
      setFrameIndex((f) => (f + ticker.deltaTime * 0.10) % animeFrames.length);
    }
    if (isTyping) {
      setTypingTime((t) => t + ticker.deltaTime * 0.15);
    } else {
      // Reset to 0 when not typing
      setTypingTime(0);
    }
  });

  const activeTexture =
    animeFrames && animeFrames.length > 0
      ? animeFrames[Math.floor(frameIndex) % animeFrames.length]
      : animeTexture;

  // Calculate arm animation offsets (subtle, out of phase for natural look)
  const rightArmOffset = isTyping ? Math.sin(typingTime * 8) * 2 : 0;
  const leftArmOffset = isTyping
    ? Math.sin(typingTime * 8 + Math.PI * 0.7) * 2
    : 0;

  // Memoize draw callbacks
  const drawBossCallback = useMemo(
    () => (g: Graphics) => drawBossBody(g, state),
    [state],
  );

  // Boss arm params: body half-width 22px, shoulder at y=0, keyboard at y=32
  const bossArmParams = useMemo(
    () => ({
      bodyHalfWidth: (BOSS_WIDTH - STROKE_WIDTH) / 2,
      startY: 0,
      endY: 32,
      handColor: 0x1f2937,
    }),
    [],
  );

  // Arm draw callbacks need to be recreated when animation changes
  const drawRightArmCallback = useCallback(
    (g: Graphics) =>
      drawRightArm(g, { ...bossArmParams, animOffset: rightArmOffset }),
    [bossArmParams, rightArmOffset],
  );

  const drawLeftArmCallback = useCallback(
    (g: Graphics) =>
      drawLeftArm(g, { ...bossArmParams, animOffset: leftArmOffset }),
    [bossArmParams, leftArmOffset],
  );

  const bubbleOffset = -80;

  return (
    <pixiContainer x={position.x} y={position.y}>
      {/* Chair - behind everything */}
      {chairTexture ? (
        <pixiSprite
          texture={chairTexture}
          anchor={0.5}
          x={5}
          y={30}
          scale={0.1386}
        />
      ) : (
        <pixiGraphics draw={drawFallbackChair} />
      )}

      {/* Boss character (body + accessories) - hidden when away from desk */}
      {!isAway && (
        <pixiContainer y={6}>
          {/* Boss body — anime sprite if available, else procedural capsule */}
          {activeTexture ? (
            <pixiSprite
              texture={activeTexture}
              anchor={{ x: 0.5, y: 1 }}
              x={0}
              y={0}
              scale={{ x: (BOSS_WIDTH * 1.8) / 192, y: (BOSS_HEIGHT * 1.8) / 320 }}
            />
          ) : (
            <>
              <pixiGraphics draw={drawBossCallback} />
              {sunglassesTexture && (
                <pixiSprite
                  texture={sunglassesTexture}
                  anchor={0.5}
                  x={0}
                  y={-19}
                  scale={{ x: 0.036, y: 0.04 }}
                  tint={0x000000}
                />
              )}
            </>
          )}
        </pixiContainer>
      )}

      {/* Desk surface - in front of boss */}
      {deskTexture ? (
        <pixiSprite
          texture={deskTexture}
          anchor={{ x: 0.5, y: 0 }}
          y={30}
          scale={0.105}
        />
      ) : (
        <pixiGraphics draw={drawFallbackDesk} />
      )}

      {/* Keyboard - on desk surface */}
      {keyboardTexture && (
        <pixiSprite
          texture={keyboardTexture}
          anchor={0.5}
          x={0}
          y={42}
          scale={0.04}
        />
      )}

      {/* Arms - only for procedural capsule, hidden when anime sprite is active */}
      {!isAway && !activeTexture && (
        <pixiContainer y={6}>
          <pixiGraphics draw={drawRightArmCallback} />
          <pixiGraphics draw={drawLeftArmCallback} />
        </pixiContainer>
      )}

      {/* Monitor - left side of desk */}
      {monitorTexture && (
        <pixiSprite
          texture={monitorTexture}
          anchor={0.5}
          x={-45}
          y={27}
          scale={0.08}
        />
      )}

      {/* Boss label - hidden when away from desk */}
      {!isAway && (
        <pixiContainer y={-155} scale={0.5}>
          <pixiText
            text="Claude"
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

      {/* Task marquee on desk - scrolling user prompt */}
      {currentTask && (
        <pixiContainer x={0} y={70}>
          <MarqueeText text={currentTask} width={115} color="#00ff88" />
        </pixiContainer>
      )}

      {/* Bubble - only render if renderBubble is true and boss is at desk */}
      {renderBubble && bubble && !isAway && (
        <Bubble content={bubble} yOffset={bubbleOffset} />
      )}
    </pixiContainer>
  );
}

export const BossSprite = memo(BossSpriteComponent);

// Export Bubble component for use in top-level bubbles layer
export { Bubble as BossBubble };

// ============================================================================
// MOBILE BOSS COMPONENT (for walking around the office)
// ============================================================================

export interface MobileBossProps {
  position: Position;
  jumpOffset?: number; // Vertical offset for jump animation
  scale?: number; // Scale factor for boss body
  sunglassesTexture: Texture | null;
  headsetTexture?: Texture | null;
  animeTexture?: Texture | null;
  animeFrames?: Texture[];
}

function MobileBossComponent({
  position,
  jumpOffset = 0,
  scale = 1.0,
  sunglassesTexture,
  headsetTexture,
  animeTexture,
  animeFrames,
}: MobileBossProps): ReactNode {
  const drawBossCallback = useMemo(
    () => (g: Graphics) => drawBossBody(g, "working"),
    [],
  );

  // Frame animation state for sprite sheet cycling (slightly faster — walking)
  const [frameIndex, setFrameIndex] = useState(0);
  useTick((ticker) => {
    if (animeFrames && animeFrames.length > 1) {
      setFrameIndex((f) => (f + ticker.deltaTime * 0.14) % animeFrames.length);
    }
  });

  const activeTexture =
    animeFrames && animeFrames.length > 0
      ? animeFrames[Math.floor(frameIndex) % animeFrames.length]
      : animeTexture;

  return (
    <pixiContainer x={position.x} y={position.y + jumpOffset} scale={scale}>
      {/* Boss body — anime sprite if available, else colored capsule */}
      {activeTexture ? (
        <pixiSprite
          texture={activeTexture}
          anchor={{ x: 0.5, y: 1 }}
          x={0}
          y={0}
          scale={{ x: (BOSS_WIDTH * 1.8) / 192, y: (BOSS_HEIGHT * 1.8) / 320 }}
        />
      ) : (
        <pixiGraphics draw={drawBossCallback} />
      )}

      {/* Sunglasses (capsule fallback only) */}
      {!activeTexture && sunglassesTexture && (
        <pixiSprite
          texture={sunglassesTexture}
          anchor={0.5}
          x={0}
          y={-19}
          scale={{ x: 0.036, y: 0.04 }}
          tint={0x000000}
        />
      )}

      {/* Headset (capsule fallback only) */}
      {!activeTexture && headsetTexture && (
        <pixiSprite
          texture={headsetTexture}
          anchor={0.5}
          x={0}
          y={-20}
          scale={{ x: 0.66825, y: 0.675 }}
        />
      )}

      {/* Boss label */}
      <pixiContainer y={-63} scale={0.5}>
        <pixiText
          text="Claude"
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
    </pixiContainer>
  );
}

export const MobileBoss = memo(MobileBossComponent);
