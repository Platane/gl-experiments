import { vec3 } from "gl-matrix";

export const MAX_ENEMIES = 1 << 10;

export const createWorld = () => {
  return {
    time: 0,
    dt: 1 / 60,
    enemies: {
      health: new Uint8Array(MAX_ENEMIES),
      positions: new Float32Array(MAX_ENEMIES * 2), // as (x,y)
      directions: new Float32Array(MAX_ENEMIES * 2), // as (x,y)

      lastHitDate: new Float32Array(),
      lastAttackDate: new Float32Array(),

      animations: Array.from({ length: MAX_ENEMIES }, () => ({
        index: 0,
        time: 0,
        startTime: 0,
      })),

      colorPaletteIndexes: new Uint8Array(MAX_ENEMIES),

      poseIndexes: new Uint8Array(MAX_ENEMIES * 2),
      poseWeights: new Float32Array(MAX_ENEMIES * 2),

      kind: new Uint8Array(MAX_ENEMIES),

      kindIndexes: [
        [0, 0], // interval index for EnemyKind.trex
        [0, 0],
        [0, 0],
      ],
    },
    player: {
      health: 10,
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),

      animation: { index: 0, time: 0, startTime: 0 },

      colorPaletteIndexes: new Uint8Array([0]),

      poseIndexes: new Uint8Array([0, 0]),
      poseWeights: new Float32Array([1, 0]),
    },
    inputs: {
      keyDown: new Set<Key>(),
    },
    camera: {
      aspect: 1,
      fovX: Math.PI / 3,
      near: 0.01,
      far: 800,
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      viewportSize: [1, 1],
      eye: [0, 3, 4] as vec3,
      lookAt: [0, 0, 0] as vec3,
    },
  };
};

export enum characterAnimation {
  idle = 0,
  run = 1,
  attack = 2,
  death = 3,
}

export enum EnemyKind {
  trex = 0,
  raptor = 1,
  para = 2,
}

export type Key =
  | "arrow_up"
  | "arrow_left"
  | "arrow_right"
  | "arrow_down"
  | "primary"
  | "secondary";

export type World = ReturnType<typeof createWorld>;
