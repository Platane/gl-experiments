import { vec3 } from "gl-matrix";
import { getAnimationParamsMap } from "../renderer/materials/instantiatedSkinnedPosedMesh/animation";

export const MAX_ENEMIES = 1 << 8;

export const createWorld = () => {
  return {
    time: 0,
    dt: 1 / 60,

    // one for each kind
    animation: [
      getAnimationParamsMap([]),
      getAnimationParamsMap([]),
      getAnimationParamsMap([]),
      getAnimationParamsMap([]),
    ],
    entities: {
      health: new Uint8Array(MAX_ENEMIES),
      positions: new Float32Array(MAX_ENEMIES * 2), // as (x,y)
      directions: new Float32Array(MAX_ENEMIES * 2), // as (x,y)

      colorPaletteIndexes: new Uint8Array(MAX_ENEMIES),

      poseIndexes: new Uint8Array(MAX_ENEMIES * 2), // as
      poseWeights: new Float32Array(MAX_ENEMIES * 2),

      kind: new Uint8Array(MAX_ENEMIES),
      boundingCircleRadius: new Float32Array(MAX_ENEMIES),

      /**
       * end interval of each kind
       * ie for the interval of one kind k :  [ kindIndexes[k-1], kindIndexes[k] [
       */
      kindIndexes: [
        1, // player ( from 0 to 1 )
        1, // EnemyKind.trex
        1, //
        1,
      ],
    },
    player: {
      targetDirection: [0, 1] as [number, number],
      state: {
        running: 0,
        attacking: 0,
      },
    },
    inputs: {
      keyDown: new Set<Key>(),
    },
    camera: {
      aspect: 1,
      fovX: Math.PI / 3,
      near: 0.01,
      far: 800,
      devicePixelRatio: 1,
      viewportSize: [1, 1],
      eye: [0, 3, 4] as vec3,
      lookAt: [0, 0, 0] as vec3,
    },
  };
};

export enum CharacterAnimation {
  idle = 0,
  run = 1,
  attack = 2,
  death = 3,
}

export enum EntityKind {
  player = 0,
  trex = 1,
  raptor = 2,
  para = 3,
}

export type Key =
  | "arrow_up"
  | "arrow_left"
  | "arrow_right"
  | "arrow_down"
  | "primary"
  | "secondary";

export type World = ReturnType<typeof createWorld>;
