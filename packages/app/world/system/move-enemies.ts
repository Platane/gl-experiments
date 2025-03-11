import { World } from "../state";
import { characterAnimation } from "../../renderer/geometries/shark";
import { vec2 } from "gl-matrix";

const v = vec2.create();
export const moveEnemies = (world: World) => {
  while (world.enemies.count < world.time / 3)
    spawn(world, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);

  for (let i = world.enemies.count; i--; ) {
    v[0] = world.enemies.positions[i * 2 + 0] - world.player.positions[0];
    v[1] = world.enemies.positions[i * 2 + 1] - world.player.positions[1];

    vec2.normalize(v, v);

    world.enemies.directions[i * 2 + 0] = -v[0];
    world.enemies.directions[i * 2 + 1] = -v[1];

    world.enemies.animations[i].time =
      world.time - world.enemies.animations[i].startTime;
  }
};

const spawn = (world: World, x: number, y: number) => {
  const i = world.enemies.count;
  world.enemies.animations[i].index = characterAnimation.idle;
  world.enemies.animations[i].startTime = world.time - i * 0.2;

  world.enemies.directions[i * 2 + 0] = 0;
  world.enemies.directions[i * 2 + 1] = 1;

  world.enemies.positions[i * 2 + 0] = x;
  world.enemies.positions[i * 2 + 1] = y;

  world.enemies.colorPaletteIndexes[i] = i % 2;

  world.enemies.count++;
};
