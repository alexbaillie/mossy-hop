"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type GameMode = "ready" | "playing" | "gameover" | "complete";
type MossyColor = "green" | "brown";
type LevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type ObstacleKind =
  | "stump"
  | "stone"
  | "mushroom"
  | "bear"
  | "tractor"
  | "piano"
  | "volcano"
  | "snowman"
  | "sled"
  | "crystal"
  | "mammoth"
  | "cactus"
  | "coral"
  | "robot"
  | "cupcake"
  | "ghost"
  | "treasure"
  | "cloudPillar"
  | "alienPlant";

type Obstacle = {
  x: number;
  width: number;
  height: number;
  kind: ObstacleKind;
  passed: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

type GameState = {
  mode: GameMode;
  level: LevelNumber;
  width: number;
  height: number;
  time: number;
  distance: number;
  speed: number;
  nextSpawn: number;
  worldX: number;
  cameraX: number;
  cleared: number;
  doubleJumpUnlocked: boolean;
  slowFallUnlocked: boolean;
  lives: number;
  invulnerable: number;
  jumpsUsed: number;
  ball: { y: number; vy: number; vx: number; grounded: boolean; landing: number };
  obstacles: Obstacle[];
  particles: Particle[];
};

const palette = {
  ink: "#173c2b",
  moss: "#55a839",
  lime: "#8acb4a",
  cream: "#fff4cf",
  peach: "#f08a5d",
  sky: "#cceadf",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const LEVEL_START_X = 150;

type LevelTheme = "meadow" | "frost" | "desert" | "coast" | "clockwork" | "candy" | "marsh" | "crystal" | "sky" | "cosmic";

type LevelConfig = {
  name: string;
  theme: LevelTheme;
  background: string;
  goalX: number;
  length: number;
  obstacleCount: number;
  pool: ObstacleKind[];
  accent: string;
  tint: string;
  finishLabel: string;
};

const LEVELS: Record<LevelNumber, LevelConfig> = {
  1: { name: "Mossy Meadow", theme: "meadow", background: "/game-terrain.png", goalX: 5700, length: 6050, obstacleCount: 12, pool: ["stump", "stone", "mushroom", "bear", "tractor", "piano", "volcano"], accent: "#6aa944", tint: "#fffdf4", finishLabel: "FINISH" },
  2: { name: "Frostlight Pass", theme: "frost", background: "/game-terrain-frost.png", goalX: 6300, length: 6650, obstacleCount: 14, pool: ["snowman", "sled", "crystal", "mammoth"], accent: "#4daed4", tint: "#eefaff", finishLabel: "SUMMIT" },
  3: { name: "Sunstone Desert", theme: "desert", background: "/game-terrain-3-sunstone.png", goalX: 7000, length: 7350, obstacleCount: 16, pool: ["cactus", "stone", "stump", "tractor", "volcano"], accent: "#d77b35", tint: "#fff4df", finishLabel: "OASIS" },
  4: { name: "Coral Coast", theme: "coast", background: "/game-terrain-4-coral.png", goalX: 7800, length: 8150, obstacleCount: 18, pool: ["coral", "mushroom", "crystal", "mammoth", "piano"], accent: "#28aeb2", tint: "#e9fbfa", finishLabel: "HARBOR" },
  5: { name: "Clockwork City", theme: "clockwork", background: "/game-terrain-5-clockwork.png", goalX: 8700, length: 9050, obstacleCount: 20, pool: ["robot", "tractor", "piano", "crystal", "sled", "stone"], accent: "#b4772d", tint: "#fbf1dd", finishLabel: "STATION" },
  6: { name: "Sugarcloud Heights", theme: "candy", background: "/game-terrain-6-sugarcloud.png", goalX: 9700, length: 10050, obstacleCount: 22, pool: ["cupcake", "mushroom", "snowman", "bear", "coral"], accent: "#dd72aa", tint: "#fff0f8", finishLabel: "CASTLE" },
  7: { name: "Moonlit Marsh", theme: "marsh", background: "/game-terrain-7-marsh.png", goalX: 10800, length: 11150, obstacleCount: 24, pool: ["ghost", "stump", "mushroom", "treasure", "bear", "crystal"], accent: "#4c9c7c", tint: "#e9f7f0", finishLabel: "LANTERN" },
  8: { name: "Crystal Caverns", theme: "crystal", background: "/game-terrain-8-crystal.png", goalX: 12000, length: 12350, obstacleCount: 26, pool: ["treasure", "crystal", "stone", "volcano", "alienPlant"], accent: "#8d62d8", tint: "#f3edff", finishLabel: "VAULT" },
  9: { name: "Sky Temple", theme: "sky", background: "/game-terrain-9-sky.png", goalX: 13300, length: 13650, obstacleCount: 28, pool: ["cloudPillar", "robot", "crystal", "mammoth", "piano", "sled"], accent: "#6a88d8", tint: "#eff4ff", finishLabel: "TEMPLE" },
  10: { name: "Cosmic Garden", theme: "cosmic", background: "/game-terrain-10-cosmic.png", goalX: 14700, length: 15050, obstacleCount: 30, pool: ["alienPlant", "ghost", "robot", "cloudPillar", "treasure", "volcano", "cupcake", "cactus"], accent: "#8764ef", tint: "#f0edff", finishLabel: "LEGEND" },
};

const OBSTACLE_SIZE: Record<ObstacleKind, { width: number; height: number }> = {
  stump: { width: 60, height: 78 }, stone: { width: 62, height: 55 }, mushroom: { width: 54, height: 70 },
  bear: { width: 62, height: 82 }, tractor: { width: 98, height: 72 }, piano: { width: 78, height: 94 }, volcano: { width: 84, height: 76 },
  snowman: { width: 62, height: 98 }, sled: { width: 108, height: 50 }, crystal: { width: 78, height: 105 }, mammoth: { width: 78, height: 94 },
  cactus: { width: 72, height: 112 }, coral: { width: 76, height: 105 }, robot: { width: 70, height: 94 }, cupcake: { width: 76, height: 88 },
  ghost: { width: 68, height: 92 }, treasure: { width: 88, height: 64 }, cloudPillar: { width: 66, height: 112 }, alienPlant: { width: 78, height: 108 },
};

const buildLevel = (level: LevelNumber): Obstacle[] => {
  const config = LEVELS[level];
  const startX = 620;
  const endX = config.goalX - 430;
  const spacing = (endX - startX) / Math.max(1, config.obstacleCount - 1);
  return Array.from({ length: config.obstacleCount }, (_, index) => {
    const kind = config.pool[(index * 2 + level + Math.floor(index / 3)) % config.pool.length];
    const base = OBSTACLE_SIZE[kind];
    const scale = 0.94 + ((index + level) % 4) * 0.035;
    const jitter = index === 0 || index === config.obstacleCount - 1 ? 0 : Math.sin((index + 1) * (level + 2.3)) * Math.min(54, spacing * 0.15);
    return {
      x: Math.round(startX + index * spacing + jitter),
      width: Math.round(base.width * scale),
      height: Math.round(base.height * scale),
      kind,
      passed: false,
    };
  });
};

const bestKeyForLevel = (level: LevelNumber) => level === 1 ? "mossy-map-best" : `mossy-map-best-${level}`;
const nextLevelAfter = (level: LevelNumber): LevelNumber => level === 10 ? 1 : (level + 1) as LevelNumber;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, Math.PI, 0);
  ctx.arc(x + 27 * scale, y - 12 * scale, 30 * scale, Math.PI, 0);
  ctx.arc(x + 64 * scale, y - 4 * scale, 24 * scale, Math.PI, 0);
  ctx.lineTo(x + 88 * scale, y + 18 * scale);
  ctx.lineTo(x - 22 * scale, y + 18 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
  baseY: number,
  color: string,
  amplitude: number,
  period: number,
) {
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, baseY);
  for (let x = 0; x <= width + 24; x += 24) {
    const y =
      baseY -
      Math.sin((x + offset) / period) * amplitude -
      Math.sin((x + offset * 0.7) / (period * 0.53)) * amplitude * 0.22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPine(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.fillStyle = color;
  for (let layer = 0; layer < 3; layer += 1) {
    const y = -18 * scale - layer * 20 * scale;
    ctx.beginPath();
    ctx.moveTo(0, y - 34 * scale);
    ctx.lineTo(-22 * scale - layer * 4, y + 14 * scale);
    ctx.quadraticCurveTo(0, y + 7 * scale, 22 * scale + layer * 4, y + 14 * scale);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#6e5438";
  roundedRect(ctx, -3 * scale, -12 * scale, 6 * scale, 15 * scale, 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  groundY: number,
  atlas?: HTMLImageElement,
  specialAtlas?: HTMLImageElement,
  frostAtlas?: HTMLImageElement,
  worldAtlasA?: HTMLImageElement,
  worldAtlasB?: HTMLImageElement,
  time = 0,
) {
  const { x, width, height, kind } = obstacle;
  const y = groundY - height;
  ctx.save();
  ctx.shadowColor = "rgba(26, 48, 28, .38)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  const isClassic = kind === "stone" || kind === "stump" || kind === "mushroom";
  const isFrost = kind === "snowman" || kind === "sled" || kind === "crystal" || kind === "mammoth";
  const isWorldA = kind === "cactus" || kind === "coral" || kind === "robot" || kind === "cupcake";
  const isWorldB = kind === "ghost" || kind === "treasure" || kind === "cloudPillar" || kind === "alienPlant";
  const activeAtlas = isWorldA ? worldAtlasA : isWorldB ? worldAtlasB : isFrost ? frostAtlas : isClassic ? atlas : specialAtlas;
  if (activeAtlas?.complete && activeAtlas.naturalWidth > 0) {
    const columns = isClassic ? 3 : 4;
    const index = isWorldA
      ? kind === "cactus" ? 0 : kind === "coral" ? 1 : kind === "robot" ? 2 : 3
      : isWorldB
      ? kind === "ghost" ? 0 : kind === "treasure" ? 1 : kind === "cloudPillar" ? 2 : 3
      : isFrost
      ? kind === "snowman" ? 0 : kind === "sled" ? 1 : kind === "crystal" ? 2 : 3
      : isClassic
      ? kind === "stone" ? 0 : kind === "stump" ? 1 : 2
      : kind === "bear" ? 0 : kind === "tractor" ? 1 : kind === "piano" ? 2 : 3;
    const sourceWidth = activeAtlas.naturalWidth / columns;
    const crop: Record<ObstacleKind, { top: number; bottom: number; heightScale: number }> = {
      stone: { top: 0.363, bottom: 0.73, heightScale: 0.96 },
      stump: { top: 0.303, bottom: 0.733, heightScale: 1.12 },
      mushroom: { top: 0.303, bottom: 0.734, heightScale: 1.12 },
      bear: { top: 0.305, bottom: 0.727, heightScale: 1.1 },
      tractor: { top: 0.313, bottom: 0.723, heightScale: 1.07 },
      piano: { top: 0.308, bottom: 0.734, heightScale: 1.11 },
      volcano: { top: 0.349, bottom: 0.742, heightScale: 1.04 },
      snowman: { top: 0.18, bottom: 0.84, heightScale: 1.14 },
      sled: { top: 0.18, bottom: 0.84, heightScale: 1.14 },
      crystal: { top: 0.18, bottom: 0.84, heightScale: 1.14 },
      mammoth: { top: 0.18, bottom: 0.84, heightScale: 1.14 },
      cactus: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      coral: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      robot: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      cupcake: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      ghost: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      treasure: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      cloudPillar: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
      alienPlant: { top: 0.16, bottom: 0.84, heightScale: 1.14 },
    };
    const cropSpec = crop[kind];
    const sourceY = activeAtlas.naturalHeight * cropSpec.top;
    const sourceHeight = activeAtlas.naturalHeight * (cropSpec.bottom - cropSpec.top);
    const targetWidth = width * (
      kind === "mushroom" ? 1.7 :
      kind === "tractor" ? 1.38 :
      kind === "piano" ? 1.42 :
      kind === "volcano" ? 1.48 :
      kind === "sled" ? 1.5 :
      kind === "snowman" ? 1.45 :
      kind === "crystal" ? 1.42 :
      kind === "mammoth" ? 1.48 :
      kind === "treasure" ? 1.5 :
      kind === "cactus" || kind === "coral" || kind === "robot" || kind === "cupcake" ? 1.44 :
      kind === "ghost" || kind === "cloudPillar" || kind === "alienPlant" ? 1.46 : 1.58
    );
    const targetHeight = height * cropSpec.heightScale;
    ctx.drawImage(
      activeAtlas,
      sourceWidth * index,
      sourceY,
      sourceWidth,
      sourceHeight,
      x - (targetWidth - width) / 2,
      groundY - targetHeight + 1,
      targetWidth,
      targetHeight,
    );

    if (kind === "volcano" || kind === "alienPlant") {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.34 + Math.sin(time * 5.5) * 0.08;
      const glowY = groundY - targetHeight * 0.68;
      const glow = ctx.createRadialGradient(x + width / 2, glowY, 1, x + width / 2, glowY, width * 0.48);
      glow.addColorStop(0, kind === "alienPlant" ? "rgba(165, 102, 255, .7)" : "rgba(255, 185, 65, .68)");
      glow.addColorStop(1, kind === "alienPlant" ? "rgba(99, 69, 255, 0)" : "rgba(255, 94, 36, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x + width / 2, glowY, width * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (kind === "stump") {
    const bark = ctx.createLinearGradient(x, 0, x + width, 0);
    bark.addColorStop(0, "#9b5138");
    bark.addColorStop(0.5, "#e17952");
    bark.addColorStop(1, "#87432f");
    roundedRect(ctx, x, y + 7, width, height - 3, 9);
    ctx.fillStyle = bark;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#f6ae73";
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 8, width / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(117, 63, 42, .42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 8, width * 0.28, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(92, 49, 34, .24)";
    for (let line = 0; line < 3; line += 1) {
      const lx = x + 10 + line * ((width - 20) / 2);
      ctx.beginPath();
      ctx.moveTo(lx, y + 20);
      ctx.bezierCurveTo(lx - 4, y + height * 0.5, lx + 5, y + height * 0.7, lx, groundY - 3);
      ctx.stroke();
    }
  } else if (kind === "stone") {
    const stone = ctx.createLinearGradient(x, y, x + width, groundY);
    stone.addColorStop(0, "#8da999");
    stone.addColorStop(1, "#4d7463");
    ctx.beginPath();
    ctx.moveTo(x + 5, groundY);
    ctx.quadraticCurveTo(x - 2, y + height * 0.45, x + width * 0.28, y + 5);
    ctx.quadraticCurveTo(x + width * 0.72, y - 5, x + width - 4, y + height * 0.42);
    ctx.quadraticCurveTo(x + width + 5, y + height * 0.75, x + width - 2, groundY);
    ctx.closePath();
    ctx.fillStyle = stone;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "rgba(232, 245, 213, .28)";
    ctx.beginPath();
    ctx.ellipse(x + width * 0.38, y + height * 0.34, width * 0.18, height * 0.1, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#89a943";
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 10 + i * 7, y + height * 0.28 + (i % 2) * 4, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#e9d0a7";
    ctx.lineWidth = Math.max(7, width * 0.18);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + width / 2, groundY - 2);
    ctx.lineTo(x + width / 2, y + 18);
    ctx.stroke();
    const cap = ctx.createLinearGradient(x, y, x, y + 26);
    cap.addColorStop(0, "#ff9a73");
    cap.addColorStop(1, "#d95848");
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + 16, width * 0.55, 18, 0, Math.PI, 0);
    ctx.quadraticCurveTo(x + width / 2, y + 34, x - width * 0.05, y + 16);
    ctx.fill();
    ctx.fillStyle = "#ffe1b2";
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + width * (0.18 + i * 0.2), y + 13 + (i % 2) * 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMossy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  vy: number,
  landing: number,
  time: number,
  sprite?: HTMLImageElement,
) {
  const airborne = Math.abs(vy) > 45;
  const stretch = airborne ? clamp(Math.abs(vy) / 1600, 0, 0.1) : 0;
  const squash = landing * 0.13;
  const breathing = airborne ? 0 : Math.sin(time * 3.2) * 0.012;
  const scaleX = 1 - stretch * 0.45 + squash + breathing;
  const scaleY = 1 + stretch - squash - breathing * 0.55;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.rotate(clamp(vy / 10000, -0.08, 0.08));
  ctx.shadowColor = "rgba(32, 82, 45, .34)";
  ctx.shadowBlur = 20;

  if (sprite?.complete && sprite.naturalWidth > 0) {
    const size = radius * 2.5;
    ctx.shadowColor = "rgba(19, 54, 25, .46)";
    ctx.shadowBlur = radius * 0.42;
    ctx.shadowOffsetY = radius * 0.12;
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(220, 245, 117, .58)";
    ctx.lineWidth = Math.max(0.75, radius * 0.019);
    ctx.lineCap = "round";
    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * Math.PI * 2;
      const sway = Math.sin(time * 4.2 + i * 1.9) * 0.04;
      const crownBoost = Math.max(0, -Math.sin(angle)) * 0.055;
      const inner = radius * 0.89;
      const outer = radius * (1.055 + (i % 4) * 0.012 + crownBoost);
      const tipX = Math.cos(angle + sway) * outer - radius * (airborne ? 0.025 : 0.012);
      const tipY = Math.sin(angle + sway) * outer;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.quadraticCurveTo(
        Math.cos(angle + sway * 0.45) * radius,
        Math.sin(angle + sway * 0.45) * radius,
        tipX,
        tipY,
      );
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const fur = ctx.createRadialGradient(-radius * 0.32, -radius * 0.38, radius * 0.08, 0, 0, radius * 1.12);
  fur.addColorStop(0, "#b8e86a");
  fur.addColorStop(0.48, "#6fbd3e");
  fur.addColorStop(1, "#347b35");
  ctx.fillStyle = fur;
  ctx.beginPath();
  const tufts = 56;
  for (let i = 0; i <= tufts; i += 1) {
    const angle = (i / tufts) * Math.PI * 2;
    const noise = Math.sin(i * 12.27 + 1.6) * 0.5 + Math.sin(i * 4.13) * 0.5;
    const rr = radius * (1.01 + noise * 0.035);
    const px = Math.cos(angle) * rr;
    const py = Math.sin(angle) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "rgba(38, 99, 45, .38)";
  ctx.lineWidth = Math.max(1.1, radius * 0.027);
  ctx.lineCap = "round";
  for (let i = 0; i < 42; i += 1) {
    const angle = (i / 42) * Math.PI * 2;
    const wobble = Math.sin(i * 7.2 + time * 2.2) * radius * 0.025;
    const inner = radius * 0.9;
    const outer = radius * (1.07 + (i % 3) * 0.018);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.05) * (radius + wobble),
      Math.sin(angle + 0.05) * (radius + wobble),
      Math.cos(angle) * outer,
      Math.sin(angle) * outer,
    );
    ctx.stroke();
  }

  const eyeY = -radius * 0.08;
  const eyeX = radius * 0.29;
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.ellipse(-eyeX, eyeY, radius * 0.085, radius * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeX, eyeY, radius * 0.085, radius * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-eyeX - radius * 0.022, eyeY - radius * 0.04, radius * 0.025, 0, Math.PI * 2);
  ctx.arc(eyeX - radius * 0.022, eyeY - radius * 0.04, radius * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(2, radius * 0.055);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, radius * 0.08, radius * 0.17, 0.16 * Math.PI, 0.84 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 150, 122, .45)";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.48, radius * 0.13, radius * 0.11, radius * 0.055, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.48, radius * 0.13, radius * 0.11, radius * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  const mossyColorRef = useRef<MossyColor>("green");
  const movementRef = useRef({ left: false, right: false });
  const [mode, setMode] = useState<GameMode>("ready");
  const [level, setLevel] = useState<LevelNumber>(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [mossyColor, setMossyColor] = useState<MossyColor>("green");
  const [cleared, setCleared] = useState(0);
  const [doubleJumpUnlocked, setDoubleJumpUnlocked] = useState(false);
  const [slowFallUnlocked, setSlowFallUnlocked] = useState(false);
  const [lives, setLives] = useState(3);
  const gameRef = useRef<GameState>({
    mode: "ready",
    level: 1,
    width: 900,
    height: 500,
    time: 0,
    distance: 0,
    speed: 0,
    nextSpawn: 1.05,
    worldX: LEVEL_START_X,
    cameraX: 0,
    cleared: 0,
    doubleJumpUnlocked: false,
    slowFallUnlocked: false,
    lives: 3,
    invulnerable: 0,
    jumpsUsed: 0,
    ball: { y: 340, vy: 0, vx: 0, grounded: true, landing: 0 },
    obstacles: buildLevel(1),
    particles: [],
  });

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(bestKeyForLevel(1)) || 0);
    if (Number.isFinite(saved)) setBest(saved);
    const savedColor = window.localStorage.getItem("mossy-hop-color");
    if (savedColor === "green" || savedColor === "brown") {
      mossyColorRef.current = savedColor;
      setMossyColor(savedColor);
    }
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume = 0.06) => {
    if (!soundRef.current) return;
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const audio = audioRef.current || new AudioCtor();
    audioRef.current = audio;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }, []);

  const burst = useCallback((x: number, y: number, count: number) => {
    const game = gameRef.current;
    for (let i = 0; i < count; i += 1) {
      const life = 0.35 + Math.random() * 0.35;
      game.particles.push({
        x,
        y,
        vx: -45 + Math.random() * 90,
        vy: -40 - Math.random() * 140,
        size: 2 + Math.random() * 5,
        life,
        maxLife: life,
        color: i % 3 === 0 ? palette.cream : i % 2 === 0 ? palette.lime : palette.moss,
      });
    }
  }, []);

  const startLevel = useCallback((nextLevel: LevelNumber) => {
    const game = gameRef.current;
    const groundY = game.height * 0.78;
    const radius = clamp(game.width * 0.046, 30, 48);
    const startsWithAbilities = nextLevel >= 2;
    const startingClears = startsWithAbilities ? 10 : 0;
    movementRef.current = { left: false, right: false };
    game.mode = "playing";
    game.level = nextLevel;
    game.distance = 0;
    game.speed = 0;
    game.nextSpawn = 0;
    game.worldX = LEVEL_START_X;
    game.cameraX = 0;
    game.cleared = startingClears;
    game.doubleJumpUnlocked = startsWithAbilities;
    game.slowFallUnlocked = startsWithAbilities;
    game.lives = 3;
    game.invulnerable = 0;
    game.jumpsUsed = 0;
    game.obstacles = buildLevel(nextLevel);
    game.particles = [];
    game.ball = { y: groundY - radius, vy: 0, vx: 0, grounded: true, landing: 0 };
    setScore(0);
    setLevel(nextLevel);
    setCleared(startingClears);
    setDoubleJumpUnlocked(startsWithAbilities);
    setSlowFallUnlocked(startsWithAbilities);
    setLives(3);
    const savedBest = Number(window.localStorage.getItem(bestKeyForLevel(nextLevel)) || 0);
    setBest(Number.isFinite(savedBest) ? savedBest : 0);
    setMode("playing");
    playTone(280 + nextLevel * 28, 0.12, 0.05);
  }, [playTone]);

  const startGame = useCallback(() => {
    const game = gameRef.current;
    const nextLevel: LevelNumber = game.mode === "complete" ? nextLevelAfter(game.level) : game.level;
    startLevel(nextLevel);
  }, [startLevel]);

  const handleJump = useCallback(() => {
    const game = gameRef.current;
    if (game.mode !== "playing") {
      startGame();
      return;
    }
    if (game.ball.grounded) {
      game.ball.vy = -760;
      game.ball.grounded = false;
      game.jumpsUsed = 1;
      burst(game.worldX - game.cameraX, game.ball.y + 24, 7);
      playTone(330, 0.1, 0.045);
      return;
    }
    const maxJumps = game.slowFallUnlocked ? 4 : 2;
    if (!game.doubleJumpUnlocked || game.jumpsUsed >= maxJumps) return;

    const gravity = 2050;
    const jumpSpeed = 760;
    const groundY = game.height * 0.78;
    const radius = clamp(game.width * 0.046, 30, 48);
    const floor = groundY - radius;
    const currentHeight = Math.max(0, floor - game.ball.y);
    const normalHeight = (jumpSpeed * jumpSpeed) / (2 * gravity);
    if (game.jumpsUsed === 1) {
      const remainingHeight = Math.max(normalHeight * 0.28, normalHeight * 2 - currentHeight);
      game.ball.vy = -Math.sqrt(2 * gravity * remainingHeight);
      game.jumpsUsed = 2;
      burst(game.worldX - game.cameraX, game.ball.y + radius * 0.55, 12);
      playTone(520, 0.14, 0.055);
      return;
    }

    // Feather Fall adds two controllable boosts. Their strength is capped by
    // the remaining canvas space so repeated taps cannot launch Mossy off-screen.
    const ceiling = radius * 1.2;
    const availableRise = Math.max(2, game.ball.y - ceiling);
    const boostSpeed = Math.min(620, Math.sqrt(2 * gravity * availableRise));
    game.ball.vy = Math.min(game.ball.vy, -boostSpeed);
    game.jumpsUsed += 1;
    burst(game.worldX - game.cameraX, game.ball.y + radius * 0.55, 10);
    playTone(540 + game.jumpsUsed * 42, 0.13, 0.05);
  }, [burst, playTone, startGame]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(event.code)) {
        event.preventDefault();
        if (event.code === "ArrowLeft" || event.code === "KeyA") movementRef.current.left = true;
        if (event.code === "ArrowRight" || event.code === "KeyD") movementRef.current.right = true;
      }
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) handleJump();
      }
      if (event.code === "KeyR" && ["gameover", "complete"].includes(gameRef.current.mode)) startGame();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") movementRef.current.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") movementRef.current.right = false;
    };
    const stopMoving = () => {
      movementRef.current = { left: false, right: false };
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", stopMoving);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", stopMoving);
    };
  }, [handleJump, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let lastTime = performance.now();
    let previousDisplayedScore = -1;
    const terrainImages = Array.from({ length: 10 }, () => {
      const image = new Image();
      image.decoding = "async";
      return image;
    });
    const ensureTerrain = (levelNumber: LevelNumber) => {
      const image = terrainImages[levelNumber - 1];
      if (!image.getAttribute("src")) image.src = LEVELS[levelNumber].background;
      return image;
    };
    ensureTerrain(1);
    const mossyGreenImage = new Image();
    const mossyBrownImage = new Image();
    const obstacleAtlas = new Image();
    const specialObstacleAtlas = new Image();
    const frostObstacleAtlas = new Image();
    const worldObstacleAtlasA = new Image();
    const worldObstacleAtlasB = new Image();
    mossyGreenImage.decoding = "async";
    mossyBrownImage.decoding = "async";
    obstacleAtlas.decoding = "async";
    specialObstacleAtlas.decoding = "async";
    frostObstacleAtlas.decoding = "async";
    worldObstacleAtlasA.decoding = "async";
    worldObstacleAtlasB.decoding = "async";
    mossyGreenImage.src = "/mossy-character-v2.png";
    mossyBrownImage.src = "/mossy-character-brown.png";
    obstacleAtlas.src = "/obstacles.png";
    specialObstacleAtlas.src = "/obstacles-special.png";
    frostObstacleAtlas.src = "/obstacles-frost.png";
    worldObstacleAtlasA.src = "/obstacles-worlds-a.png";
    worldObstacleAtlasB.src = "/obstacles-worlds-b.png";

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gameRef.current.width = rect.width;
      gameRef.current.height = rect.height;
      if (gameRef.current.mode === "ready") {
        gameRef.current.worldX = LEVEL_START_X;
        gameRef.current.cameraX = 0;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (now: number) => {
      const game = gameRef.current;
      const dt = Math.min((now - lastTime) / 1000, 0.034);
      lastTime = now;
      game.time += dt;
      const { width, height } = game;
      const groundY = height * 0.78;
      const radius = clamp(width * 0.046, 30, 48);
      let ballX = game.worldX - game.cameraX;
      const levelConfig = LEVELS[game.level];
      const isFrost = (["frost", "coast", "marsh", "crystal", "sky", "cosmic"] as LevelTheme[]).includes(levelConfig.theme);
      const isDark = (["frost", "marsh", "crystal", "cosmic"] as LevelTheme[]).includes(levelConfig.theme);
      const mossyImage = mossyColorRef.current === "brown" ? mossyBrownImage : mossyGreenImage;

      if (game.mode === "playing") {
        const direction = Number(movementRef.current.right) - Number(movementRef.current.left);
        const targetVx = direction * 285;
        const acceleration = game.ball.grounded ? 1450 : 880;
        const velocityStep = acceleration * dt;
        game.ball.vx += clamp(targetVx - game.ball.vx, -velocityStep, velocityStep);
        if (direction === 0 && Math.abs(game.ball.vx) < 2) game.ball.vx = 0;
        game.speed = Math.abs(game.ball.vx);
        game.worldX = clamp(game.worldX + game.ball.vx * dt, radius, levelConfig.length - radius);
        game.distance = Math.max(0, game.worldX - LEVEL_START_X);
        const cameraTarget = clamp(game.worldX - width * 0.38, 0, Math.max(0, levelConfig.length - width));
        const cameraEase = 1 - Math.exp(-dt * 5.5);
        game.cameraX += (cameraTarget - game.cameraX) * cameraEase;
        ballX = game.worldX - game.cameraX;
        game.invulnerable = Math.max(0, game.invulnerable - dt);
        const currentScore = clamp(
          Math.round(((game.worldX - LEVEL_START_X) / (levelConfig.goalX - LEVEL_START_X)) * 100),
          0,
          100,
        );
        if (currentScore !== previousDisplayedScore) {
          previousDisplayedScore = currentScore;
          setScore(currentScore);
        }
        // Once Feather Fall is unlocked, downward physics advances at half
        // time so the complete descent is exactly half speed. Rising is unchanged.
        const verticalTimeScale = game.slowFallUnlocked && game.ball.vy > 0 ? 0.5 : 1;
        game.ball.vy += 2050 * dt * verticalTimeScale;
        game.ball.y += game.ball.vy * dt * verticalTimeScale;
        const floor = groundY - radius;
        if (game.ball.y >= floor) {
          if (!game.ball.grounded && game.ball.vy > 180) {
            game.ball.landing = 1;
            burst(ballX, groundY - 3, 6);
          }
          game.ball.y = floor;
          game.ball.vy = 0;
          game.ball.grounded = true;
          game.jumpsUsed = 0;
        }
        game.ball.landing = Math.max(0, game.ball.landing - dt * 5.5);

        for (const obstacle of game.obstacles) {
          if (!obstacle.passed && game.ball.vx >= 0 && obstacle.x + obstacle.width < game.worldX - radius * 0.15) {
            obstacle.passed = true;
            game.cleared += 1;
            setCleared(game.cleared);
            if (!game.doubleJumpUnlocked && game.cleared >= 3) {
              game.doubleJumpUnlocked = true;
              setDoubleJumpUnlocked(true);
              playTone(620, 0.18, 0.055);
            }
            if (!game.slowFallUnlocked && game.cleared >= 10) {
              game.slowFallUnlocked = true;
              setSlowFallUnlocked(true);
              burst(ballX, game.ball.y, 16);
              playTone(760, 0.24, 0.06);
            }
          }
        }

        const left = game.worldX - radius * 0.61;
        const right = game.worldX + radius * 0.61;
        const top = game.ball.y - radius * 0.62;
        const bottom = game.ball.y + radius * 0.67;
        const hitObstacle = game.invulnerable <= 0 ? game.obstacles.find((obstacle) => {
          const inset = obstacle.kind === "tractor" || obstacle.kind === "sled" || obstacle.kind === "treasure"
            ? 10
            : obstacle.kind === "mushroom" || obstacle.kind === "bear" || obstacle.kind === "mammoth" || obstacle.kind === "cupcake" || obstacle.kind === "coral"
              ? 7
              : 5;
          return (
            right > obstacle.x + inset &&
            left < obstacle.x + obstacle.width - inset &&
            bottom > groundY - obstacle.height + 5 &&
            top < groundY
          );
        }) : undefined;
        if (hitObstacle) {
          game.lives -= 1;
          setLives(game.lives);
          burst(ballX + radius * 0.4, game.ball.y, 18);
          if (game.lives > 0) {
            game.invulnerable = 1.4;
            const hitFromLeft = game.ball.vx >= 0;
            game.worldX = hitFromLeft
              ? hitObstacle.x - radius * 0.82
              : hitObstacle.x + hitObstacle.width + radius * 0.82;
            game.ball.vx = hitFromLeft ? -150 : 150;
            game.ball.vy = -540;
            game.ball.grounded = false;
            game.jumpsUsed = 1;
            playTone(220, 0.2, 0.065);
          } else {
            game.mode = "gameover";
            movementRef.current = { left: false, right: false };
            setMode("gameover");
            playTone(170, 0.28, 0.07);
            setBest((oldBest) => {
              const nextBest = Math.max(oldBest, currentScore);
              window.localStorage.setItem(bestKeyForLevel(game.level), String(nextBest));
              return nextBest;
            });
          }
        }

        if (game.mode === "playing" && game.worldX >= levelConfig.goalX) {
          game.mode = "complete";
          movementRef.current = { left: false, right: false };
          game.ball.vx = 0;
          setMode("complete");
          setScore(100);
          setBest((oldBest) => {
            const nextBest = Math.max(oldBest, 100);
            window.localStorage.setItem(bestKeyForLevel(game.level), String(nextBest));
            return nextBest;
          });
          burst(ballX, game.ball.y, 28);
          playTone(880, 0.38, 0.065);
          if (game.level < 10) window.localStorage.setItem("mossy-highest-level", String(game.level + 1));
        }
      } else if (game.mode === "ready") {
        game.ball.y = groundY - radius + Math.sin(game.time * 3) * 4;
        game.ball.landing = 0;
      }

      for (const particle of game.particles) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 280 * dt;
      }
      game.particles = game.particles.filter((particle) => particle.life > 0);

      const activeTerrain = ensureTerrain(game.level);
      if (game.mode === "complete" && game.level < 10) ensureTerrain(nextLevelAfter(game.level));
      const terrainReady = activeTerrain.complete && activeTerrain.naturalWidth > 0;
      if (terrainReady) {
        ctx.fillStyle = isDark ? "#132a56" : levelConfig.tint;
        ctx.fillRect(0, 0, width, height);
        const scale = Math.max(width / activeTerrain.naturalWidth, height / activeTerrain.naturalHeight) * 1.045;
        const drawWidth = activeTerrain.naturalWidth * scale;
        const drawHeight = activeTerrain.naturalHeight * scale;
        const travel = Math.max(0, drawWidth - width);
        const drift = Math.sin(game.time * 0.075) * Math.min(20, travel * 0.45);
        const drawX = (width - drawWidth) / 2 + drift;
        const drawY = groundY - drawHeight * 0.746;
        ctx.drawImage(activeTerrain, drawX, drawY, drawWidth, drawHeight);

        const depthLight = ctx.createLinearGradient(0, 0, 0, height);
        depthLight.addColorStop(0, isFrost ? "rgba(126, 225, 255, .08)" : "rgba(255, 241, 177, .1)");
        depthLight.addColorStop(0.64, isFrost ? "rgba(19, 67, 126, 0)" : "rgba(23, 70, 43, 0)");
        depthLight.addColorStop(1, isFrost ? "rgba(3, 19, 63, .28)" : "rgba(13, 40, 25, .2)");
        ctx.fillStyle = depthLight;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const ray = ctx.createLinearGradient(width * 0.82, 0, width * 0.45, height * 0.74);
        ray.addColorStop(0, isFrost ? "rgba(142, 229, 255, .17)" : "rgba(255, 244, 184, .2)");
        ray.addColorStop(1, isFrost ? "rgba(99, 192, 255, 0)" : "rgba(255, 244, 184, 0)");
        ctx.fillStyle = ray;
        ctx.beginPath();
        ctx.moveTo(width * 0.72, 0);
        ctx.lineTo(width * 0.94, 0);
        ctx.lineTo(width * 0.63, groundY);
        ctx.lineTo(width * 0.43, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        for (let i = 0; i < 13; i += 1) {
          const moteX = ((i * 113 - game.cameraX * 0.035) % (width + 40) + width + 40) % (width + 40) - 20;
          const moteY = height * (0.16 + ((i * 37) % 45) / 100) + Math.sin(game.time * 0.8 + i) * 4;
          ctx.globalAlpha = isFrost ? 0.34 + (i % 3) * 0.07 : 0.18 + (i % 3) * 0.06;
          ctx.fillStyle = i % 2 ? levelConfig.tint : levelConfig.accent;
          ctx.beginPath();
          ctx.arc(moteX, moteY, 1.2 + (i % 3) * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        const groundDepth = ctx.createLinearGradient(0, groundY, 0, height);
        groundDepth.addColorStop(0, isFrost ? "rgba(26, 89, 147, 0)" : "rgba(24, 68, 34, 0)");
        groundDepth.addColorStop(1, isFrost ? "rgba(3, 20, 65, .27)" : "rgba(9, 36, 24, .18)");
        ctx.fillStyle = groundDepth;
        ctx.fillRect(0, groundY, width, height - groundY);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, isDark ? "#162d66" : levelConfig.tint);
        sky.addColorStop(0.55, levelConfig.accent);
        sky.addColorStop(1, levelConfig.tint);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);
        drawCloud(ctx, width * 0.12 - ((game.cameraX * 0.025) % (width + 180)), height * 0.2, 0.7, 0.6);
        drawHills(ctx, width, height, game.cameraX * 0.035, height * 0.57, "#a7cfaf", height * 0.09, 130);
        drawHills(ctx, width, height, game.cameraX * 0.085, height * 0.66, "#78ad7d", height * 0.105, 92);
        const treeSpacing = 150;
        for (let i = -1; i < width / treeSpacing + 2; i += 1) {
          const x = i * treeSpacing - ((game.cameraX * 0.13) % treeSpacing);
          drawPine(ctx, x, groundY + 2, 0.63 + ((i + 4) % 3) * 0.12, "#477d5c");
        }
        const soil = ctx.createLinearGradient(0, groundY, 0, height);
        soil.addColorStop(0, levelConfig.accent);
        soil.addColorStop(1, isDark ? "#182650" : "#3a4937");
        ctx.fillStyle = soil;
        ctx.fillRect(0, groundY, width, height - groundY);
      }

      ctx.strokeStyle = levelConfig.tint;
      ctx.lineWidth = terrainReady ? 1.1 : 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 1);
      for (let x = 0; x <= width; x += 14) {
        ctx.lineTo(x, groundY + Math.sin((x + game.cameraX) * 0.04) * 1.8);
      }
      ctx.stroke();

      for (let i = 0; i < width / 36 + 1; i += 1) {
        const x = i * 36 - (game.cameraX % 36);
        const blade = 5 + (i % 4) * 2;
        if (isFrost) {
          ctx.fillStyle = i % 2 ? "rgba(220, 250, 255, .72)" : "rgba(109, 214, 245, .64)";
          ctx.beginPath();
          ctx.moveTo(x, groundY + 1);
          ctx.lineTo(x + 3, groundY - blade);
          ctx.lineTo(x + 6, groundY + 1);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.strokeStyle = i % 2 ? levelConfig.tint : levelConfig.accent;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x, groundY + 2);
          ctx.quadraticCurveTo(x + 2, groundY - blade * 0.7, x + (i % 2 ? 5 : -4), groundY - blade);
          ctx.stroke();
        }
      }

      // Small rooted details travel with the world, so Mossy reads as the
      // runner moving through the clearing instead of scenery flying at him.
      const trackSpacing = 92;
      const trackStart = Math.floor(game.cameraX / trackSpacing);
      for (let i = -1; i < width / trackSpacing + 2; i += 1) {
        const worldIndex = trackStart + i;
        const x = i * trackSpacing - (game.cameraX % trackSpacing);
        const variant = ((worldIndex % 4) + 4) % 4;
        ctx.save();
        ctx.globalAlpha = terrainReady ? 0.58 : 0.72;
        ctx.fillStyle = isFrost
          ? variant % 2 ? "rgba(205, 243, 255, .55)" : "rgba(102, 192, 226, .5)"
          : levelConfig.accent;
        ctx.beginPath();
        ctx.ellipse(x, groundY + 3, 11 + variant * 1.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isFrost
          ? variant % 2 ? "#e0fbff" : "#70d2ef"
          : variant % 2 ? levelConfig.tint : levelConfig.accent;
        ctx.lineWidth = 1.2;
        for (let sprig = 0; sprig < 3; sprig += 1) {
          const sx = x - 6 + sprig * 6;
          const height = 4 + ((worldIndex + sprig * 3) % 5 + 5) % 5;
          ctx.beginPath();
          ctx.moveTo(sx, groundY + 1);
          if (isFrost) {
            ctx.lineTo(sx + (sprig - 1) * 1.5, groundY - height);
          } else {
            ctx.quadraticCurveTo(sx - 1, groundY - height * 0.55, sx + (sprig - 1) * 2, groundY - height);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      const goalX = levelConfig.goalX - game.cameraX;
      if (goalX > -120 && goalX < width + 140) {
        ctx.save();
        ctx.fillStyle = isFrost ? "rgba(1, 20, 68, .32)" : "rgba(18, 49, 27, .28)";
        ctx.beginPath();
        ctx.ellipse(goalX, groundY + 4, 62, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = levelConfig.accent;
        roundedRect(ctx, goalX - 52, groundY - 126, 12, 128, 5);
        ctx.fill();
        roundedRect(ctx, goalX + 40, groundY - 126, 12, 128, 5);
        ctx.fill();
        ctx.fillStyle = levelConfig.tint;
        roundedRect(ctx, goalX - 63, groundY - 139, 126, 36, 11);
        ctx.fill();
        ctx.strokeStyle = isFrost ? "#163f79" : palette.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = isFrost ? "#163f79" : palette.ink;
        ctx.font = `900 ${Math.max(12, width * 0.014)}px Arial Rounded MT Bold, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(levelConfig.finishLabel, goalX, groundY - 121);
        ctx.fillStyle = levelConfig.accent;
        ctx.beginPath();
        ctx.moveTo(goalX + 51, groundY - 125);
        ctx.lineTo(goalX + 84, groundY - 111);
        ctx.lineTo(goalX + 51, groundY - 95);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      for (const obstacle of game.obstacles) {
        const screenObstacle = { ...obstacle, x: obstacle.x - game.cameraX };
        if (screenObstacle.x < -170 || screenObstacle.x > width + 170) continue;
        ctx.fillStyle = "rgba(14, 43, 24, .34)";
        ctx.beginPath();
        ctx.ellipse(
          screenObstacle.x + screenObstacle.width / 2,
          groundY + 2,
          screenObstacle.width * 0.56,
          Math.max(3, screenObstacle.width * 0.065),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        drawObstacle(
          ctx,
          screenObstacle,
          groundY,
          obstacleAtlas,
          specialObstacleAtlas,
          frostObstacleAtlas,
          worldObstacleAtlasA,
          worldObstacleAtlasB,
          game.time,
        );

        ctx.save();
        ctx.fillStyle = levelConfig.accent;
        ctx.beginPath();
        ctx.ellipse(screenObstacle.x + screenObstacle.width * 0.28, groundY, screenObstacle.width * 0.22, 3.4, -0.08, 0, Math.PI * 2);
        ctx.ellipse(screenObstacle.x + screenObstacle.width * 0.72, groundY, screenObstacle.width * 0.25, 3.8, 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = levelConfig.tint;
        ctx.lineWidth = 1.15;
        for (let sprig = 0; sprig < 4; sprig += 1) {
          const sx = screenObstacle.x + screenObstacle.width * (0.18 + sprig * 0.21);
          const lean = sprig % 2 ? 3 : -3;
          ctx.beginPath();
          ctx.moveTo(sx, groundY + 1);
          ctx.quadraticCurveTo(sx + lean * 0.4, groundY - 4, sx + lean, groundY - 7 - (sprig % 3));
          ctx.stroke();
        }
        ctx.restore();
      }

      if (game.mode === "playing" && Math.abs(game.ball.vx) > 25) {
        const runPhase = game.worldX / Math.max(1, radius * 1.7);
        const moveSign = game.ball.vx >= 0 ? 1 : -1;
        ctx.save();
        ctx.strokeStyle = "rgba(239, 249, 193, .2)";
        ctx.lineWidth = Math.max(1, radius * 0.035);
        ctx.lineCap = "round";
        for (let streak = 0; streak < 3; streak += 1) {
          const trailY = game.ball.y + radius * (-0.34 + streak * 0.34) + Math.sin(runPhase + streak) * 2;
          const trailX = ballX - moveSign * radius * (1.05 + streak * 0.26);
          ctx.beginPath();
          ctx.moveTo(trailX - moveSign * radius * (0.52 + streak * 0.12), trailY);
          ctx.quadraticCurveTo(trailX - moveSign * radius * 0.2, trailY - 2, trailX, trailY);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.fillStyle = "rgba(31, 69, 41, .22)";
      const shadowScale = clamp(1 - (groundY - game.ball.y - radius) / 300, 0.35, 1);
      ctx.beginPath();
      ctx.ellipse(ballX, groundY + 7, radius * 0.78 * shadowScale, radius * 0.17 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      const mossyVisible = game.invulnerable <= 0 || Math.floor(game.time * 14) % 2 === 0;
      if (mossyVisible) {
        if (!game.ball.grounded && mossyImage.complete && mossyImage.naturalWidth > 0) {
          for (let ghost = 3; ghost >= 1; ghost -= 1) {
            ctx.globalAlpha = 0.026 * ghost;
            drawMossy(
              ctx,
              ballX - ghost * 3,
              game.ball.y - game.ball.vy * ghost * 0.0009,
              radius * (1 - ghost * 0.018),
              game.ball.vy,
              0,
              game.time - ghost * 0.035,
              mossyImage,
            );
          }
          ctx.globalAlpha = 1;
        }
        drawMossy(ctx, ballX, game.ball.y, radius, game.ball.vy, game.ball.landing, game.time, mossyImage);
      }

      for (let i = 0; i < 7; i += 1) {
        const leafX = ((i * 181 - game.cameraX * (0.14 + (i % 3) * 0.025)) % (width + 90) + width + 90) % (width + 90) - 45;
        const leafY = height * (0.18 + ((i * 19) % 48) / 100) + Math.sin(game.time * 1.15 + i * 2.4) * 12;
        const leafSize = 3.5 + (i % 3) * 1.4;
        ctx.save();
        ctx.translate(leafX, leafY);
        ctx.rotate(game.time * (0.55 + i * 0.04) + i);
        ctx.globalAlpha = 0.36 + (i % 2) * 0.16;
        ctx.fillStyle = i % 2 ? levelConfig.tint : levelConfig.accent;
        if (levelConfig.theme === "coast") {
          ctx.strokeStyle = levelConfig.tint;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, leafSize * 0.82, 0, Math.PI * 2);
          ctx.stroke();
        } else if (levelConfig.theme === "clockwork") {
          ctx.fillRect(-leafSize * 0.6, -leafSize * 0.6, leafSize * 1.2, leafSize * 1.2);
        } else if (levelConfig.theme === "candy") {
          roundedRect(ctx, -leafSize * 1.2, -leafSize * 0.38, leafSize * 2.4, leafSize * 0.76, leafSize * 0.35);
          ctx.fill();
        } else if (levelConfig.theme === "crystal" || levelConfig.theme === "cosmic") {
          ctx.beginPath();
          ctx.moveTo(0, -leafSize * 1.4);
          ctx.lineTo(leafSize * 0.55, 0);
          ctx.lineTo(0, leafSize * 1.4);
          ctx.lineTo(-leafSize * 0.55, 0);
          ctx.closePath();
          ctx.fill();
        } else if (levelConfig.theme === "sky") {
          ctx.beginPath();
          ctx.ellipse(0, 0, leafSize * 1.7, leafSize * 0.48, -0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (levelConfig.theme === "frost" || levelConfig.theme === "marsh") {
          ctx.shadowColor = levelConfig.accent;
          ctx.shadowBlur = levelConfig.theme === "marsh" ? 8 : 0;
          ctx.beginPath();
          ctx.arc(0, 0, leafSize * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else if (levelConfig.theme === "desert") {
          ctx.beginPath();
          ctx.ellipse(0, 0, leafSize * 0.8, leafSize * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, leafSize * 1.65, leafSize * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      for (const particle of game.particles) {
        ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const vignette = ctx.createRadialGradient(width / 2, height * 0.42, height * 0.2, width / 2, height * 0.5, width * 0.72);
      vignette.addColorStop(0, isDark ? "rgba(13, 46, 103, 0)" : "rgba(20, 55, 34, 0)");
      vignette.addColorStop(1, isDark ? "rgba(3, 16, 62, .23)" : "rgba(17, 56, 35, .16)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [burst, playTone]);

  const toggleSound = () => {
    setSoundOn((current) => {
      soundRef.current = !current;
      return !current;
    });
  };

  const chooseMossyColor = (color: MossyColor) => {
    mossyColorRef.current = color;
    setMossyColor(color);
    window.localStorage.setItem("mossy-hop-color", color);
    playTone(color === "brown" ? 245 : 310, 0.1, 0.035);
  };

  const setMovement = (direction: "left" | "right", active: boolean) => {
    movementRef.current[direction] = active;
  };

  const currentLevelConfig = LEVELS[level];
  const nextLevelConfig = LEVELS[nextLevelAfter(level)];
  const shellStyle = {
    "--level-accent": currentLevelConfig.accent,
    "--level-tint": currentLevelConfig.tint,
  } as CSSProperties;

  return (
    <main className="game-page">
      <header className="site-header" aria-label="Mossy Hop">
        <div className="brand-lockup">
          <span className="brand-dot" aria-hidden="true" />
          <span>Mossy Hop</span>
        </div>
        <p>Ten worlds. Your pace.</p>
      </header>

      <section className={`game-shell theme-${currentLevelConfig.theme}`} style={shellStyle} aria-label="Mossy Hop game">
        <div className="score-bar">
          <div className="score-group">
            <div className="level-chip">
              <span className="score-label">Level</span>
              <strong>{level}<small>/10</small></strong>
            </div>
            <span className="score-divider" aria-hidden="true" />
            <div>
              <span className="score-label">Progress</span>
              <strong>{score}%</strong>
            </div>
            <span className="score-divider" aria-hidden="true" />
            <div>
              <span className="score-label">Best</span>
              <strong>{best}%</strong>
            </div>
          </div>
          <div className="score-actions">
            <div className="color-picker" role="group" aria-label="Choose Mossy's fur color">
              <span className="color-picker-label">Fur</span>
              {(["green", "brown"] as MossyColor[]).map((color) => (
                <button
                  className={`color-choice ${mossyColor === color ? "is-active" : ""}`}
                  type="button"
                  key={color}
                  onClick={() => chooseMossyColor(color)}
                  aria-pressed={mossyColor === color}
                  aria-label={`Make Mossy ${color}`}
                >
                  <span className={`color-swatch is-${color}`} aria-hidden="true" />
                  <span className="color-name">{color}</span>
                </button>
              ))}
            </div>
            <button className="sound-button" type="button" onClick={toggleSound} aria-label={soundOn ? "Mute sound" : "Turn sound on"}>
              <span className={`sound-icon ${soundOn ? "is-on" : "is-off"}`} aria-hidden="true" />
              {soundOn ? "Sound on" : "Sound off"}
            </button>
          </div>
        </div>

        <div className="game-viewport">
          <canvas
            ref={canvasRef}
            className="game-canvas"
            onPointerDown={handleJump}
            aria-label={`Mossy, a ${mossyColor} fluffy ball, exploring level ${level}, ${currentLevelConfig.name}. Use A and D or the arrow keys to move, and press Space, W, or the up arrow to jump.`}
            role="img"
          />

          <div className="lives-hud" role="status" aria-live="polite" aria-label={`${lives} ${lives === 1 ? "life" : "lives"} remaining`}>
            <span>Lives</span>
            <div className="life-icons" aria-hidden="true">
              {[0, 1, 2].map((life) => (
                <img
                  className={`life-mossy ${life >= lives ? "is-lost" : ""}`}
                  src={mossyColor === "brown" ? "/mossy-character-brown.png" : "/mossy-character-v2.png"}
                  alt=""
                  width="34"
                  height="34"
                  key={life}
                />
              ))}
            </div>
          </div>

          <div className="journey-hud" aria-label={`Level ${level} of 10: ${currentLevelConfig.name}`}>
            <span>{currentLevelConfig.name}</span>
            <div className="journey-dots" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
                <i className={step < level ? "is-complete" : step === level ? "is-current" : ""} key={step} />
              ))}
            </div>
          </div>

          {mode !== "playing" && (
            <div className={`game-overlay ${mode === "gameover" ? "is-gameover" : mode === "complete" ? "is-complete" : ""}`}>
              <div className="eyebrow">
                {mode === "ready"
                  ? "Ten worlds await"
                  : mode === "complete"
                    ? level === 10 ? "All ten levels complete!" : `Level ${level} complete!`
                    : `${currentLevelConfig.name} tumble!`}
              </div>
              <h1>
                {mode === "ready"
                  ? "Explore at your pace."
                  : mode === "complete"
                    ? level === 10 ? "Mossy mastered every world!" : `${nextLevelConfig.name} awaits.`
                    : `${score}% explored.`}
              </h1>
              <p>
                {mode === "ready"
                  ? "Move freely through ten increasingly long, detailed worlds. Every finish opens a stranger, richer trail with fresh lives and new obstacles."
                  : mode === "complete"
                    ? level === 10
                      ? "From Mossy Meadow to the Cosmic Garden, you crossed every trail. The whole ten-level journey is ready to play again."
                      : `${nextLevelConfig.name} is longer and more challenging. Mossy enters with three fresh lives and every ability unlocked.`
                    : best === score && score > 0
                      ? "New best! Mossy is impressed."
                      : `Your best exploration of level ${level} is ${best}%. The trail is ready when you are.`}
              </p>
              <button className="play-button" type="button" onClick={startGame}>
                <span>
                  {mode === "ready"
                    ? "Enter the meadow"
                    : mode === "complete"
                      ? level === 10 ? "Play all ten again" : `Enter ${nextLevelConfig.name}`
                      : "Try again"}
                </span>
                <span className="button-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          )}

        </div>

        <div className={`control-strip ${slowFallUnlocked ? "is-slow-fall" : doubleJumpUnlocked ? "is-unlocked" : ""}`}>
          <div className="control-copy">
            <span className="control-kicker">
              {slowFallUnlocked
                ? "Feather Fall unlocked!"
                : doubleJumpUnlocked
                  ? `${Math.max(0, 10 - cleared)} clears to half-speed falling`
                  : `${Math.max(0, 3 - cleared)} clears to double jump`}
            </span>
            <span>
              {slowFallUnlocked
                ? "Half-speed falling plus two more mid-air jumps — four jumps total."
                : doubleJumpUnlocked
                  ? "Keep hopping: clear ten obstacles to slow every descent."
                  : mode === "playing"
                  ? "Clear three obstacles to unlock a second jump."
                  : "Move freely, stop whenever you like, and jump when you're ready."}
            </span>
          </div>
          <div className="move-controls" aria-label="Movement controls">
            <button
              type="button"
              aria-label="Move Mossy left"
              onPointerDown={() => setMovement("left", true)}
              onPointerUp={() => setMovement("left", false)}
              onPointerLeave={() => setMovement("left", false)}
              onPointerCancel={() => setMovement("left", false)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Move Mossy right"
              onPointerDown={() => setMovement("right", true)}
              onPointerUp={() => setMovement("right", false)}
              onPointerLeave={() => setMovement("right", false)}
              onPointerCancel={() => setMovement("right", false)}
            >
              →
            </button>
            <button className="jump-control" type="button" onPointerDown={handleJump}>
              {slowFallUnlocked ? "Jump ×4" : doubleJumpUnlocked ? "Jump ×2" : "Jump"}
            </button>
          </div>
        </div>
      </section>

      <p className="page-note" aria-live="polite">
        {mode === "complete"
          ? level === 10
            ? "Ten levels complete — Mossy conquered the Cosmic Garden!"
            : `Level ${level} complete — next up: ${nextLevelConfig.name}.`
          : slowFallUnlocked
          ? `${currentLevelConfig.name} — ${currentLevelConfig.obstacleCount} obstacles, Feather Fall, and four jumps.`
          : doubleJumpUnlocked
            ? `${Math.max(0, 10 - cleared)} more ${10 - cleared === 1 ? "obstacle" : "obstacles"} to unlock half-speed falling.`
            : mode === "playing"
              ? `${Math.max(0, 3 - cleared)} more ${3 - cleared === 1 ? "obstacle" : "obstacles"} to unlock double jump.`
              : "Move with A/D or ←/→. Jump with Space, W, ↑, or a tap."}
      </p>
    </main>
  );
}
