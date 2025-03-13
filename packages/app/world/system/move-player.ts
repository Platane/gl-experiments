import { vec2 } from "gl-matrix";
import { characterAnimation, World } from "../state";

const dir = vec2.create();
const v = vec2.create();
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

    world.player.targetDirection[0] = dir[0];
    world.player.targetDirection[1] = dir[1];

    world.entities.positions[0] += dir[0] * SPEED * world.dt;
    world.entities.positions[1] += dir[1] * SPEED * world.dt;

    if (world.entities.animationIndexes[0] != characterAnimation.run) {
      world.entities.animationIndexes[0] = characterAnimation.run;
      world.entities.animationTimes[0] = 0;
    }
  } else {
    if (world.entities.animationIndexes[0] != characterAnimation.idle) {
      world.entities.animationIndexes[0] = characterAnimation.idle;
      world.entities.animationTimes[0] = 0;
    }
  }

  // rotate current direction to reach targetDirection
  {
    const at = Math.atan2(
      world.player.targetDirection[1],
      world.player.targetDirection[0],
    );
    const an = Math.atan2(
      world.entities.directions[1],
      world.entities.directions[0],
    );

    if (Math.abs(at - an) > 0.00001) {
      let delta = (at - an + Math.PI * 2) % (Math.PI * 2);

      if (delta > Math.PI) delta -= Math.PI * 2;

      const d = Math.abs(delta);

      // either 0.25 of the distance, or a minimum of Math.PI / 10
      // without being more that d
      const arc = Math.min(d, Math.max(d * 0.25, Math.PI / 10));

      const a = an + Math.sign(delta) * arc;

      world.entities.directions[0] = Math.cos(a);
      world.entities.directions[1] = Math.sin(a);
    }
  }

  world.entities.animationTimes[0] += world.dt;
};
