import { vec2 } from "gl-matrix";
import {
  fillAnimationParams,
  type AnimationParamsMap,
} from "../../app/renderer/materials/instantiatedSkinnedPosedMesh/animation";

export const createWorld = (
  n: number,
  buffer: ArrayBuffer | SharedArrayBuffer,
  animationParamsMap: AnimationParamsMap,
) => {
  let i = 0;

  const positions = new Float32Array(buffer, i, n * 2);
  i += n * 2 * 4;
  const directions = new Float32Array(buffer, i, n * 2);
  i += n * 2 * 4;
  const poseWeights = new Float32Array(buffer, i, n * 2);
  i += n * 2 * 4;
  const target = new Float32Array(buffer, i, n * 2);
  i += n * 2 * 4;
  const stats = new Float32Array(buffer, i, 4);
  i += 4 * 4;
  const colorPaletteIndexes = new Uint8Array(buffer, i, n);
  i += n;
  const poseIndexes = new Uint8Array(buffer, i, n * 2);
  i += n * 2;

  return {
    dt: 1 / 60,
    t: 0,
    n,
    stats,
    positions,
    directions,
    colorPaletteIndexes,
    poseIndexes,
    poseWeights,
    target,
    animationParamsMap,
  };
};

export type World = ReturnType<typeof createWorld>;

export const stepWorld = (world: World) => {
  world.t += world.dt;

  const startDate = performance.now();

  moveFishes(world);
  updateAnimations(world);

  world.stats[0] = performance.now() - startDate;
};

const moveFishes = (world: World) => {
  const v = vec2.create();

  const SPEED = 18;
  const TARGET_DISTANCE = 20 + Math.sqrt(world.n) * 0.9;
  const BOUNDING_CIRCLE_RADIUS = 1.3;

  const s = SPEED * world.dt;

  for (let i = world.n; i--; ) {
    v[0] = world.target[i * 2 + 0] - world.positions[i * 2 + 0];
    v[1] = world.target[i * 2 + 1] - world.positions[i * 2 + 1];

    const l = vec2.length(v);

    if (l <= s) {
      const a = Math.random() * Math.PI * 2;
      const A = TARGET_DISTANCE + Math.random() * TARGET_DISTANCE * 0.1;

      world.target[i * 2 + 0] = Math.cos(a) * A;
      world.target[i * 2 + 1] = Math.sin(a) * A;
    } else {
      world.positions[i * 2 + 0] += (v[0] / l) * s;
      world.positions[i * 2 + 1] += (v[1] / l) * s;

      world.directions[i * 2 + 0] = v[0] / l;
      world.directions[i * 2 + 1] = v[1] / l;
    }
  }

  for (let i = world.n; i--; ) {
    for (let j = i; j--; ) {
      v[0] = world.positions[j * 2 + 0] - world.positions[i * 2 + 0];
      v[1] = world.positions[j * 2 + 1] - world.positions[i * 2 + 1];

      const l = vec2.length(v);

      if (l > 0 && l < BOUNDING_CIRCLE_RADIUS * 2) {
        const pen = BOUNDING_CIRCLE_RADIUS * 2 - l;

        const correction = Math.min((pen / 2) * 0.8, s * 0.99);

        world.positions[j * 2 + 0] += (v[0] / l) * correction;
        world.positions[j * 2 + 1] += (v[1] / l) * correction;

        world.positions[i * 2 + 0] -= (v[0] / l) * correction;
        world.positions[i * 2 + 1] -= (v[1] / l) * correction;
      }
    }
  }
};

const updateAnimations = (world: World) => {
  for (let i = world.n; i--; )
    fillAnimationParams(
      world.animationParamsMap,
      world.poseIndexes,
      world.poseWeights,
      i * 2,
      4,
      world.t + i * 0.12,
    );
};
