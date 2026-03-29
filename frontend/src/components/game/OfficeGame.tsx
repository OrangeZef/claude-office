/**
 * OfficeGame - Main Game Canvas
 *
 * Main visualization component using:
 * - Centralized Zustand store
 * - XState state machines
 * - Single animation tick loop
 *
 * The component is purely for rendering - all state logic is in the store/machines.
 */

"use client";

import { Application, extend } from "@pixi/react";
import {
  Container,
  Text,
  Graphics,
  Sprite,
  Application as PixiApplication,
} from "pixi.js";
import { useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { useShallow } from "zustand/react/shallow";
import { performFullCleanup, getHmrVersion } from "@/systems/hmrCleanup";

import {
  useGameStore,
  selectAgents,
  selectBoss,
  selectTodos,
  selectDebugMode,
  selectShowPaths,
  selectShowQueueSlots,
  selectShowPhaseLabels,
  selectShowObstacles,
  selectElevatorState,
  selectContextUtilization,
  selectIsCompacting,
  selectPrintReport,
  selectIsConnected,
} from "@/stores/gameStore";
import { useAnimationSystem } from "@/systems/animationSystem";
import { useCompactionAnimation } from "@/systems/compactionAnimation";
import { useOfficeTextures } from "@/hooks/useOfficeTextures";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BACKGROUND_COLOR,
} from "@/constants/canvas";
import {
  EMPLOYEE_OF_MONTH_POSITION,
  CITY_WINDOW_POSITION,
  SAFETY_SIGN_POSITION,
  WALL_CLOCK_POSITION,
  WALL_OUTLET_POSITION,
  WHITEBOARD_POSITION,
  WATER_COOLER_POSITION,
  COFFEE_MACHINE_POSITION,
  PRINTER_STATION_POSITION,
  PLANT_POSITION,
  BOSS_RUG_POSITION,
  TRASH_CAN_OFFSET,
} from "@/constants/positions";
import {
  AgentSprite,
  AgentArms,
  AgentLabel,
  Bubble as AgentBubble,
} from "./AgentSprite";
import { BossSprite, BossBubble, MobileBoss } from "./BossSprite";
import { isInElevatorZone } from "@/systems/queuePositions";
import { TrashCanSprite } from "./TrashCanSprite";
import { WallClock } from "./WallClock";
import { Whiteboard } from "./Whiteboard";
import { SafetySign } from "./SafetySign";
import { CityWindow } from "./CityWindow";
import { EmployeeOfTheMonth } from "./EmployeeOfTheMonth";
import { Elevator, isAgentInElevator } from "./Elevator";
import { PrinterStation } from "./PrinterStation";
import { DebugOverlays } from "./DebugOverlays";
import {
  DeskSurfacesBase,
  DeskSurfacesTop,
  useDeskPositions,
} from "./DeskGrid";
import { ZoomControls } from "./ZoomControls";
import { LoadingScreen } from "./LoadingScreen";
import { OfficeBackground } from "./OfficeBackground";
import { IdleWorker } from "./IdleWorker";
import { JokaSign } from "./JokaSign";
import { CatSprite } from "./CatSprite";
import { CatFurniture, CatBed, CatTree } from "./CatFurniture";
import { CatFoodArea } from "./CatFoodArea";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { CoffeeTable } from "./CoffeeTable";
import { ServerRack } from "./ServerRack";
import { WarningLight } from "./WarningLight";

// Register PixiJS components
extend({ Container, Text, Graphics, Sprite });

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OfficeGame(): ReactNode {
  // Track PixiJS app for cleanup
  const appRef = useRef<PixiApplication | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // HMR version for forcing remount
  const hmrVersion = getHmrVersion();

  // Load all office textures
  const { textures, loaded: spritesLoaded } = useOfficeTextures();

  // Start animation system
  useAnimationSystem();

  // Cleanup on unmount (HMR or navigation)
  useEffect(() => {
    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, {
            children: true,
            texture: true,
            textureSource: true,
          });
        } catch {
          // Ignore cleanup errors
        }
        appRef.current = null;
      }
      performFullCleanup();
    };
  }, []);

  // Subscribe to store state
  const agents = useGameStore(useShallow(selectAgents));
  const boss = useGameStore(selectBoss);
  const todos = useGameStore(selectTodos);
  const debugMode = useGameStore(selectDebugMode);
  const showPaths = useGameStore(selectShowPaths);
  const showQueueSlots = useGameStore(selectShowQueueSlots);
  const showPhaseLabels = useGameStore(selectShowPhaseLabels);
  const showObstacles = useGameStore(selectShowObstacles);
  const elevatorState = useGameStore(selectElevatorState);
  const contextUtilization = useGameStore(selectContextUtilization);
  const isCompacting = useGameStore(selectIsCompacting);
  const printReport = useGameStore(selectPrintReport);
  const isConnected = useGameStore(selectIsConnected);
  const whiteboardData = useGameStore((s) => s.whiteboardData);

  // Preferences
  const showCats = usePreferencesStore((s) => s.showCats);
  const showIdleWorkers = usePreferencesStore((s) => s.showIdleWorkers);

  // Compaction animation state
  const compactionAnimation = useCompactionAnimation();

  // Use store's elevator state (controlled by state machine)
  const isElevatorOpen = elevatorState === "open";

  // Calculate occupied desks
  const occupiedDesks = useMemo(() => {
    const desks = new Set<number>();
    for (const agent of agents.values()) {
      if (agent.desk && agent.phase === "idle") {
        desks.add(agent.desk);
      }
    }
    return desks;
  }, [agents]);

  // Calculate desk tasks for marquee display
  const deskTasks = useMemo(() => {
    const tasks = new Map<number, string>();
    for (const agent of agents.values()) {
      if (agent.desk && agent.phase === "idle") {
        const label = agent.currentTask ?? agent.name ?? "";
        if (label) tasks.set(agent.desk, label);
      }
    }
    return tasks;
  }, [agents]);

  // Compute top agent from whiteboard agentLifespans (most entries)
  const topAgent = useMemo(() => {
    const lifespans = whiteboardData?.agentLifespans ?? [];
    if (lifespans.length === 0) return undefined;
    // Count number of lifespan entries per agent name
    const counts = new Map<string, number>();
    for (const ls of lifespans) {
      const name = ls.agentName ?? "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let bestName: string | undefined;
    let bestCount = 0;
    for (const [name, count] of counts.entries()) {
      if (count > bestCount) {
        bestName = name;
        bestCount = count;
      }
    }
    return bestName ? { name: bestName } : undefined;
  }, [whiteboardData?.agentLifespans]);

  // Shared idle desk tracking (prevents two IdleWorkers picking the same desk)
  const [idleOccupiedDesks, setIdleOccupiedDesks] = useState<Set<number>>(new Set());

  // Desk count
  const deskCount = useMemo(() => {
    return Math.max(8, Math.ceil(agents.size / 4) * 4);
  }, [agents.size]);

  // Desk positions for Y-sorted rendering
  const deskPositions = useDeskPositions(deskCount, occupiedDesks);

  // Stable Set passed to all 3 IdleWorker instances — avoids new Set() on every render
  const idleWorkerOccupiedDesks = useMemo(
    () => new Set([...occupiedDesks, ...idleOccupiedDesks]),
    [occupiedDesks, idleOccupiedDesks],
  );

  // Keyboard shortcuts for debug
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === "d" || e.key === "D") {
        useGameStore.getState().setDebugMode(!debugMode);
      }
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
      if (debugMode) {
        if (e.key === "p" || e.key === "P") {
          useGameStore.getState().toggleDebugOverlay("paths");
        }
        if (e.key === "q" || e.key === "Q") {
          useGameStore.getState().toggleDebugOverlay("queueSlots");
        }
        if (e.key === "l" || e.key === "L") {
          useGameStore.getState().toggleDebugOverlay("phaseLabels");
        }
        if (e.key === "o" || e.key === "O") {
          useGameStore.getState().toggleDebugOverlay("obstacles");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debugMode]);

  // Compute fit scale and centering position explicitly — no reliance on
  // centerOnInit which has race conditions with PixiJS rendering.
  const [fitScale, setFitScale] = useState<number | null>(null);

  const centerCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container || !transformRef.current) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const s = Math.min(rect.width / CANVAS_WIDTH, rect.height / CANVAS_HEIGHT);
    setFitScale(s);
    // Explicitly compute centered position and set transform
    const scaledW = CANVAS_WIDTH * s;
    const scaledH = CANVAS_HEIGHT * s;
    const x = (rect.width - scaledW) / 2;
    const y = (rect.height - scaledH) / 2;
    transformRef.current.setTransform(x, y, s, 0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Initial fit
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setFitScale(Math.min(rect.width / CANVAS_WIDTH, rect.height / CANVAS_HEIGHT));
    }
    // Re-center on resize (sidebar toggle)
    const observer = new ResizeObserver(() => centerCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [centerCanvas]);

  // Re-center after sprites finish loading
  useEffect(() => {
    if (spritesLoaded) {
      // Give PixiJS time to paint, then center
      const timer = setTimeout(centerCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [spritesLoaded, centerCanvas]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
    >
      {fitScale !== null && (
      <TransformWrapper
        ref={transformRef}
        initialScale={fitScale}
        minScale={0.2}
        maxScale={3}
        wheel={{ step: 0.08 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: "reset" }}
        limitToBounds={false}
      >
        <ZoomControls />
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass=""
        >
          <div className="pixi-canvas-container" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <Application
              key={`pixi-app-${hmrVersion}`}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              backgroundColor={BACKGROUND_COLOR}
              autoDensity={true}
              resolution={
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
              }
              onInit={(app) => {
                appRef.current = app;
              }}
            >
              {/* Office content - hidden while loading */}
              {spritesLoaded && (
                <>
                  {/* Floor and walls */}
                  <OfficeBackground floorTileTexture={textures.floorTile} />

                  {/* Ceiling fluorescent lights */}
                  {[320, 640, 960].map((lx) => (
                    <pixiContainer key={`light-${lx}`} x={lx} y={5}>
                      <pixiGraphics draw={(g: Graphics) => {
                        g.clear();
                        // Light fixture housing
                        g.roundRect(-60, -4, 120, 8, 2);
                        g.fill(0x555555);
                        // Light tube (bright)
                        g.roundRect(-55, -2, 110, 4, 1);
                        g.fill({ color: 0xffffff, alpha: 0.9 });
                        // Light glow cone on floor
                        g.beginPath();
                        g.moveTo(-55, 4);
                        g.lineTo(-120, 80);
                        g.lineTo(120, 80);
                        g.lineTo(55, 4);
                        g.closePath();
                        g.fill({ color: 0xffffff, alpha: 0.03 });
                      }} />
                    </pixiContainer>
                  ))}

                  {/* Boss area rug - rendered right after floor */}
                  {textures.bossRug && (
                    <pixiSprite
                      texture={textures.bossRug}
                      anchor={0.5}
                      x={BOSS_RUG_POSITION.x}
                      y={BOSS_RUG_POSITION.y}
                      scale={0.3}
                    />
                  )}

                  {/* Wall decorations */}
                  <pixiContainer
                    x={EMPLOYEE_OF_MONTH_POSITION.x}
                    y={EMPLOYEE_OF_MONTH_POSITION.y}
                  >
                    <EmployeeOfTheMonth topAgent={topAgent} />
                  </pixiContainer>
                  <pixiContainer
                    x={CITY_WINDOW_POSITION.x}
                    y={CITY_WINDOW_POSITION.y}
                  >
                    <CityWindow />
                  </pixiContainer>
                  <pixiContainer
                    x={SAFETY_SIGN_POSITION.x}
                    y={SAFETY_SIGN_POSITION.y}
                  >
                    <SafetySign />
                  </pixiContainer>
                  <pixiContainer
                    x={WALL_CLOCK_POSITION.x}
                    y={WALL_CLOCK_POSITION.y}
                  >
                    <WallClock />
                  </pixiContainer>
                  {/* Wall outlet below clock */}
                  {textures.wallOutlet && (
                    <pixiSprite
                      texture={textures.wallOutlet}
                      anchor={0.5}
                      x={WALL_OUTLET_POSITION.x}
                      y={WALL_OUTLET_POSITION.y}
                      scale={0.04}
                    />
                  )}
                  <pixiContainer
                    x={WHITEBOARD_POSITION.x}
                    y={WHITEBOARD_POSITION.y}
                  >
                    <Whiteboard todos={todos} />
                  </pixiContainer>
                  {textures.waterCooler && (
                    <pixiSprite
                      texture={textures.waterCooler}
                      anchor={0.5}
                      x={WATER_COOLER_POSITION.x}
                      y={WATER_COOLER_POSITION.y}
                      scale={0.198}
                    />
                  )}
                  {/* Coffee machine - to the right of water cooler */}
                  {textures.coffeeMachine && (
                    <pixiSprite
                      texture={textures.coffeeMachine}
                      anchor={0.5}
                      x={COFFEE_MACHINE_POSITION.x}
                      y={COFFEE_MACHINE_POSITION.y}
                      scale={0.1}
                    />
                  )}

                  {/* Printer station - bottom left corner */}
                  {/* Only print after boss delivers the completion message */}
                  <PrinterStation
                    x={PRINTER_STATION_POSITION.x}
                    y={PRINTER_STATION_POSITION.y}
                    isPrinting={
                      printReport && !isCompacting && !!boss.bubble.content
                    }
                    deskTexture={textures.desk}
                    printerTexture={textures.printer}
                  />

                  {/* Plant - to the right of printer */}
                  {textures.plant && (
                    <pixiSprite
                      texture={textures.plant}
                      anchor={0.5}
                      x={PLANT_POSITION.x}
                      y={PLANT_POSITION.y}
                      scale={0.1}
                    />
                  )}

                  {/* JokaSign - above elevator, near top-left wall area */}
                  <JokaSign
                    x={10}
                    y={10}
                  />

                  {/* Elevator with animated doors and agents inside */}
                  <Elevator
                    isOpen={isElevatorOpen}
                    agents={agents}
                    frameTexture={textures.elevatorFrame}
                    doorTexture={textures.elevatorDoor}
                    headsetTexture={textures.headset}
                    sunglassesTexture={textures.sunglasses}
                    workerVariants={textures.workerVariants}
                  />

                  {/* Y-sorted layer: chairs and agents sorted by Y position (higher Y = in front) */}
                  <pixiContainer sortableChildren={true}>
                    {/* Desk chairs - zIndex based on chair seat back */}
                    {deskPositions.map((desk, i) => {
                      const chairZIndex = desk.y + 20;
                      return (
                        <pixiContainer
                          key={`chair-${i}`}
                          x={desk.x}
                          y={desk.y}
                          zIndex={chairZIndex}
                        >
                          {textures.chair && (
                            <pixiSprite
                              texture={textures.chair}
                              anchor={0.5}
                              x={0}
                              y={30}
                              scale={0.1386}
                            />
                          )}
                        </pixiContainer>
                      );
                    })}

                    {/* Agents outside elevator - zIndex based on feet Y position */}
                    {Array.from(agents.values())
                      .filter(
                        (agent) =>
                          !isAgentInElevator(
                            agent.currentPosition.x,
                            agent.currentPosition.y,
                          ),
                      )
                      .map((agent, agentIndex) => (
                        <pixiContainer
                          key={agent.id}
                          zIndex={agent.currentPosition.y + (agent.phase === "idle" ? 100 : 0)}
                        >
                          <AgentSprite
                            id={agent.id}
                            name={agent.name}
                            color={agent.color}
                            number={agent.number}
                            position={agent.currentPosition}
                            phase={agent.phase}
                            bubble={agent.bubble.content}
                            headsetTexture={textures.headset}
                            sunglassesTexture={textures.sunglasses}
                            renderBubble={false}
                            renderLabel={false}
                            isTyping={agent.isTyping}
                            workerVariants={textures.workerVariants}
                            variantIndex={agentIndex}
                            backendState={agent.backendState}
                          />
                        </pixiContainer>
                      ))}

                    {/* Cat furniture in y-sorted layer with low zIndex so cats render on top */}
                    {showCats && (
                      <>
                        <pixiContainer zIndex={250}>
                          <CatFurniture />
                        </pixiContainer>
                        <pixiContainer zIndex={860}>
                          <CatBed x={400} y={880} />
                        </pixiContainer>
                        <pixiContainer zIndex={255}>
                          <CatFoodArea x={1140} y={275} />
                        </pixiContainer>
                        <pixiContainer zIndex={255}>
                          <CatTree x={1250} y={275} />
                        </pixiContainer>
                      </>
                    )}

                    {/* Cats in y-sorted layer — render on top of furniture */}
                    {showCats && (
                      <>
                        <CatSprite color={0x111111} accentColor={0xff8888} startX={200} startY={500} />
                        <CatSprite color={0xf0ede0} accentColor={0xffccaa} startX={900} startY={700} />
                      </>
                    )}

                    {/* Idle workers inside y-sorted layer so desks occlude them */}
                    {showIdleWorkers && (
                      <>
                        <IdleWorker
                          workerVariants={textures.workerVariants}
                          occupiedDeskNums={idleWorkerOccupiedDesks}
                          agentOccupiedDeskNums={occupiedDesks}
                          instanceIndex={0}
                          onClaimDesk={(n) => setIdleOccupiedDesks((prev) => new Set([...prev, n]))}
                          onReleaseDesk={(n) => setIdleOccupiedDesks((prev) => { const s = new Set(prev); s.delete(n); return s; })}
                        />
                        <IdleWorker
                          workerVariants={textures.workerVariants}
                          occupiedDeskNums={idleWorkerOccupiedDesks}
                          agentOccupiedDeskNums={occupiedDesks}
                          instanceIndex={1}
                          onClaimDesk={(n) => setIdleOccupiedDesks((prev) => new Set([...prev, n]))}
                          onReleaseDesk={(n) => setIdleOccupiedDesks((prev) => { const s = new Set(prev); s.delete(n); return s; })}
                        />
                        <IdleWorker
                          workerVariants={textures.workerVariants}
                          occupiedDeskNums={idleWorkerOccupiedDesks}
                          agentOccupiedDeskNums={occupiedDesks}
                          instanceIndex={2}
                          onClaimDesk={(n) => setIdleOccupiedDesks((prev) => new Set([...prev, n]))}
                          onReleaseDesk={(n) => setIdleOccupiedDesks((prev) => { const s = new Set(prev); s.delete(n); return s; })}
                        />
                      </>
                    )}
                  </pixiContainer>

                  {/* Desk surfaces and keyboards (behind agent arms) */}
                  <DeskSurfacesBase
                    deskCount={deskCount}
                    occupiedDesks={occupiedDesks}
                    deskTexture={textures.desk}
                    keyboardTexture={textures.keyboard}
                  />

                  {/* Agent arms - rendered after desk/keyboard, before headsets */}
                  {Array.from(agents.values())
                    .filter((agent) => agent.phase === "idle")
                    .map((agent) => (
                      <AgentArms
                        key={`arms-${agent.id}`}
                        position={agent.currentPosition}
                        isTyping={agent.isTyping}
                      />
                    ))}

                  {/* Monitors and decorations (in front of agent arms) */}
                  <DeskSurfacesTop
                    deskCount={deskCount}
                    occupiedDesks={occupiedDesks}
                    deskTasks={deskTasks}
                    monitorTexture={textures.monitor}
                    coffeeMugTexture={textures.coffeeMug}
                    staplerTexture={textures.stapler}
                    deskLampTexture={textures.deskLamp}
                    penHolderTexture={textures.penHolder}
                    magic8BallTexture={textures.magic8Ball}
                    rubiksCubeTexture={textures.rubiksCube}
                    rubberDuckTexture={textures.rubberDuck}
                    thermosTexture={textures.thermos}
                  />

                  {/* Boss */}
                  <BossSprite
                    position={boss.position}
                    state={boss.backendState}
                    bubble={boss.bubble.content}
                    inUseBy={boss.inUseBy}
                    currentTask={boss.currentTask}
                    chairTexture={textures.chair}
                    deskTexture={textures.desk}
                    keyboardTexture={textures.keyboard}
                    monitorTexture={textures.monitor}
                    phoneTexture={textures.phone}
                    sunglassesTexture={textures.sunglasses}
                    renderBubble={false}
                    isTyping={boss.isTyping}
                    isAway={compactionAnimation.phase !== "idle"}
                    animeFrames={textures.animeBossFrames}
                  />

                  {/* Mobile Boss (when walking to/from trash can) */}
                  {compactionAnimation.bossPosition && (
                    <MobileBoss
                      position={compactionAnimation.bossPosition}
                      jumpOffset={compactionAnimation.jumpOffset}
                      scale={compactionAnimation.bossScale}
                      sunglassesTexture={textures.sunglasses}
                      animeFrames={textures.animeBossFrames}
                    />
                  )}

                  {/* Trash Can (Context Utilization Indicator) - right of boss desk */}
                  <TrashCanSprite
                    x={boss.position.x + TRASH_CAN_OFFSET.x}
                    y={boss.position.y + TRASH_CAN_OFFSET.y}
                    contextUtilization={
                      compactionAnimation.phase !== "idle"
                        ? compactionAnimation.animatedContextUtilization
                        : contextUtilization
                    }
                    isCompacting={isCompacting}
                    isStomping={compactionAnimation.isStomping}
                  />

                  {/* Cat furniture BEFORE desk surfaces but rendered so cats appear on top */}
                  {/* Placed here (after y-sorted container, before desk surfaces) so desks */}
                  {/* occlude them, but cats in the y-sorted container need to be moved after */}
                  {/* furniture for correct layering — handled by moving furniture earlier */}

                  {/* Coffee table - under coffee machine */}
                  <CoffeeTable x={1054} y={210} />

                  {/* Server rack cluster - bottom right corner, horizontal row */}
                  <ServerRack x={1070} y={910} contextUtilization={contextUtilization} isConnected={isConnected} activityLevel={whiteboardData?.activityLevel ?? 0} />
                  <ServerRack x={1135} y={910} contextUtilization={contextUtilization} isConnected={isConnected} activityLevel={whiteboardData?.activityLevel ?? 0} />
                  <ServerRack x={1200} y={910} contextUtilization={contextUtilization} isConnected={isConnected} activityLevel={whiteboardData?.activityLevel ?? 0} />

                  {/* Warning light - top right area, flashes on agent errors */}
                  <WarningLight x={1240} y={80} active={!isConnected || (whiteboardData?.recentErrorCount ?? 0) > 0} />

                  {/* Idle workers moved into y-sorted container above */}

                  {/* Debug overlays */}
                  {debugMode && (
                    <DebugOverlays
                      showPaths={showPaths}
                      showQueueSlots={showQueueSlots}
                      showPhaseLabels={showPhaseLabels}
                      showObstacles={showObstacles}
                    />
                  )}

                  {/* Debug mode indicator */}
                  {debugMode && (
                    <pixiText
                      text="DEBUG MODE (D=toggle, P=paths, Q=queue, L=labels, O=obstacles, T=time)"
                      x={10}
                      y={10}
                      style={{
                        fontSize: 12,
                        fill: 0x00ff00,
                        fontFamily: "monospace",
                      }}
                    />
                  )}

                  {/* Labels Layer - rendered on top of most things */}
                  {Array.from(agents.values())
                    .filter(
                      (agent) =>
                        agent.name && !isInElevatorZone(agent.currentPosition),
                    )
                    .map((agent) => (
                      <AgentLabel
                        key={`label-${agent.id}`}
                        name={agent.name!}
                        position={agent.currentPosition}
                      />
                    ))}

                  {/* Bubbles Layer - rendered on top of everything */}
                  {Array.from(agents.values())
                    .filter(
                      (agent) =>
                        agent.bubble.content &&
                        !isInElevatorZone(agent.currentPosition),
                    )
                    .map((agent) => (
                      <pixiContainer
                        key={`bubble-${agent.id}`}
                        x={agent.currentPosition.x}
                        y={agent.currentPosition.y}
                      >
                        <AgentBubble
                          content={agent.bubble.content!}
                          yOffset={-185}
                        />
                      </pixiContainer>
                    ))}
                  {boss.bubble.content && (
                    <pixiContainer x={boss.position.x} y={boss.position.y}>
                      <BossBubble content={boss.bubble.content} yOffset={-160} />
                    </pixiContainer>
                  )}
                </>
              )}
            </Application>
          </div>
        </TransformComponent>
      </TransformWrapper>
      )}
      {/* Loading screen - HTML overlay shown while sprites are loading */}
      {!spritesLoaded && <LoadingScreen />}
    </div>
  );
}
