import { vec3 } from "gl-matrix";

export const createWorld = () => {
  return {
    enemies: {
      health: new Uint8Array(),
      positions: new Float32Array(), // as (x,y)
      directions: new Float32Array(), // as (x,y)

      lastHitDate: new Float32Array(),
      lastAttackDate: new Float32Array(),
    },
    player: {
      health: 10,
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),

      animation: { index: 0, time: 0 },

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

export type Key =
  | "arrow_up"
  | "arrow_left"
  | "arrow_right"
  | "arrow_down"
  | "primary"
  | "secondary";

export type World = ReturnType<typeof createWorld>;
