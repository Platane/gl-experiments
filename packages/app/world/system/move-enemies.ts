import { characterAnimation, EntityKind, World } from "../state";
import { vec2 } from "gl-matrix";
import { addEntity } from "./enemyListHelper";

const v = vec2.create();
export const moveEnemies = (world: World) => {
  const enemyCount = world.entities.kindIndexes.at(-1)!;

  const px = world.entities.positions[0];
  const py = world.entities.positions[1];
  for (let i = 1; i < enemyCount; i++) {
    v[0] = world.entities.positions[i * 2 + 0] - px;
    v[1] = world.entities.positions[i * 2 + 1] - py;

    vec2.normalize(v, v);

    world.entities.directions[i * 2 + 0] = -v[0];
    world.entities.directions[i * 2 + 1] = -v[1];

    world.entities.animationIndexes[i] = characterAnimation.idle;
    world.entities.animationTimes[i] += world.dt;
  }
};

let lastSpawnTime = 0;
export const spawnEnemies = (world: World) => {
  if (
    lastSpawnTime + 1 < world.time &&
    world.entities.kindIndexes.at(-1)! < 3
  ) {
    lastSpawnTime = world.time;

    const i = addEntity(world, Math.floor(Math.random() * 3) + 1);

    const a = Math.random() * 6.2;
    const A = Math.random() + 4;
    world.entities.positions[i * 2 + 0] = Math.sin(a) * A;
    world.entities.positions[i * 2 + 1] = Math.cos(a) * A;
  }
};
