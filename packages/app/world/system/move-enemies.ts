import { characterAnimation, EnemyKind, World } from "../state";
import { vec2 } from "gl-matrix";

const v = vec2.create();
export const moveEnemies = (world: World) => {
  // while (world.enemies.count < world.time / 3)
  //   spawn(world, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);

  if (world.enemies.kindIndexes[EnemyKind.trex][1] === 0) initialSpawn(world);

  const enemyCount = world.enemies.kindIndexes.at(-1)![1];
  for (let i = enemyCount; i--; ) {
    v[0] = world.enemies.positions[i * 2 + 0] - world.player.positions[0];
    v[1] = world.enemies.positions[i * 2 + 1] - world.player.positions[1];

    vec2.normalize(v, v);

    world.enemies.directions[i * 2 + 0] = -v[0];
    world.enemies.directions[i * 2 + 1] = -v[1];

    world.enemies.animations[i].time =
      world.time - world.enemies.animations[i].startTime;
  }
};

const initialSpawn = (world: World) => {
  for (let i = 10; i--; ) {
    world.enemies.animations[i].index = characterAnimation.idle;
    world.enemies.animations[i].startTime = world.time - Math.random();

    world.enemies.directions[i * 2 + 0] = 0;
    world.enemies.directions[i * 2 + 1] = 1;

    world.enemies.positions[i * 2 + 0] = Math.random() * 8 - 4;
    world.enemies.positions[i * 2 + 1] = -2;

    world.enemies.colorPaletteIndexes[i] = i % 2;
  }

  world.enemies.positions[0 * 2 + 0] = -4;
  world.enemies.positions[1 * 2 + 0] = -3;
  world.enemies.positions[2 * 2 + 0] = -2;

  world.enemies.positions[3 * 2 + 0] = 0;
  world.enemies.positions[4 * 2 + 0] = 0.5;
  world.enemies.positions[5 * 2 + 0] = -0.5;

  world.enemies.positions[6 * 2 + 0] = 3;
  world.enemies.positions[7 * 2 + 0] = 3.5;
  world.enemies.positions[8 * 2 + 0] = 4;
  world.enemies.positions[9 * 2 + 0] = 4.5;

  world.enemies.kindIndexes[EnemyKind.trex] = [0, 3];
  world.enemies.kindIndexes[EnemyKind.raptor] = [3, 6];
  world.enemies.kindIndexes[EnemyKind.para] = [6, 10];
};
