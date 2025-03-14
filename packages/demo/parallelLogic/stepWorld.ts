import { vec2 } from "gl-matrix";

export const createWorld = (n: number) => ({
  dt: 0,
  t: 0,
  n,
  positions: new Float32Array(n * 2),
  directions: new Float32Array(n * 2),
  colorPaletteIndexes: new Uint8Array(n),
  poseIndexes: new Uint8Array(n * 2),
  poseWeights: new Float32Array(n * 2),

  target: new Float32Array(n * 2),
});

export type World = ReturnType<typeof createWorld>;

export const stepWorld = (world: World) => {
  const v = vec2.create();

  const SPEED = 0.1;
  const TARGET_DISTANCE = 20 + Math.sqrt(world.n) * 0.8;
  const BOUNDING_CIRCLE_RADIUS = 1.3;

  for (let i = world.n; i--; ) {
    v[0] = world.target[i * 2 + 0] - world.positions[i * 2 + 0];
    v[1] = world.target[i * 2 + 1] - world.positions[i * 2 + 1];

    const l = vec2.length(v);

    if (l <= SPEED) {
      const a = Math.random() * Math.PI * 2;
      const A = TARGET_DISTANCE + Math.random() * TARGET_DISTANCE * 0.1;

      world.target[i * 2 + 0] = Math.cos(a) * A;
      world.target[i * 2 + 1] = Math.sin(a) * A;
    } else {
      world.positions[i * 2 + 0] += (v[0] / l) * SPEED;
      world.positions[i * 2 + 1] += (v[1] / l) * SPEED;

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

        const correction = Math.min((pen / 2) * 0.8, SPEED * 0.99);

        world.positions[j * 2 + 0] += (v[0] / l) * correction;
        world.positions[j * 2 + 1] += (v[1] / l) * correction;

        world.positions[i * 2 + 0] -= (v[0] / l) * correction;
        world.positions[i * 2 + 1] -= (v[1] / l) * correction;
      }
    }
  }
};
