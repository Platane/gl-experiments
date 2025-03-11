import { characterAnimation, EnemyKind, World } from "../state";
import { vec2 } from "gl-matrix";
import { remove, spawn } from "./enemyListHelper";

let lastSpawnTime = 0;
let inited = false;
const v = vec2.create();
export const moveEnemies = (world: World) => {
  if (!inited) {
    initialSpawn(world);
    inited = true;
  }

  if (
    lastSpawnTime + 1 < world.time &&
    world.enemies.kindIndexes.at(-1)![1] < 3
  ) {
    lastSpawnTime = world.time;

    const i = spawn(world, Math.floor(Math.random() * 3));

    const a = Math.random() * 6.2;
    const A = Math.random() + 4;
    world.enemies.positions[i * 2 + 0] = Math.sin(a) * A;
    world.enemies.positions[i * 2 + 1] = Math.cos(a) * A;
  }

  const enemyCount = world.enemies.kindIndexes.at(-1)![1];
  for (let i = enemyCount; i--; ) {
    v[0] = world.enemies.positions[i * 2 + 0] - world.player.positions[0];
    v[1] = world.enemies.positions[i * 2 + 1] - world.player.positions[1];

    vec2.normalize(v, v);

    world.enemies.directions[i * 2 + 0] = -v[0];
    world.enemies.directions[i * 2 + 1] = -v[1];

    world.enemies.animationIndexes[i] = characterAnimation.idle;
    world.enemies.animationTimes[i] += world.dt;
  }
};

const initialSpawn = (world: World) => {
  for (let i = 100; i--; ) {
    world.enemies.colorPaletteIndexes[i] = i % 2;
  }

  world.enemies.positions[0 * 2 + 0] = -2;
  world.enemies.positions[1 * 2 + 0] = 0;
  world.enemies.positions[2 * 2 + 0] = 2;

  world.enemies.positions[0 * 2 + 1] = -1.5;
  world.enemies.positions[1 * 2 + 1] = -1.5;
  world.enemies.positions[2 * 2 + 1] = -1.5;

  world.enemies.kindIndexes[EnemyKind.trex] = [0, 1];
  world.enemies.kindIndexes[EnemyKind.raptor] = [1, 2];
  world.enemies.kindIndexes[EnemyKind.para] = [2, 3];
};
