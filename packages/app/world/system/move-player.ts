import { vec2 } from "gl-matrix";
import { characterAnimation, World } from "../state";

const dir = vec2.create();
export const movePlayer = (world: World) => {
  dir[0] = 0;
  dir[1] = 0;

  if (world.inputs.keyDown.has("arrow_down")) dir[1]++;
  if (world.inputs.keyDown.has("arrow_up")) dir[1]--;
  if (world.inputs.keyDown.has("arrow_left")) dir[0]--;
  if (world.inputs.keyDown.has("arrow_right")) dir[0]++;

  if (dir[0] || dir[1]) {
    vec2.normalize(dir, dir);

    const SPEED = 2.8; // unit / second

    world.player.directions[0] = dir[0];
    world.player.directions[1] = dir[1];

    world.player.positions[0] += dir[0] * SPEED * world.dt;
    world.player.positions[1] += dir[1] * SPEED * world.dt;

    if (world.player.animation.index != characterAnimation.run) {
      world.player.animation.index = characterAnimation.run;
      world.player.animation.startTime = world.time;
    }
  } else {
    if (world.player.animation.index != characterAnimation.idle) {
      world.player.animation.index = characterAnimation.idle;
      world.player.animation.startTime = world.time;
    }
  }

  world.player.animation.time = world.time - world.player.animation.startTime;
};
