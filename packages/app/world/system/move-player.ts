import { vec2 } from "gl-matrix";
import { CharacterAnimation, EntityKind, World } from "../state";
import { fillAnimationParams } from "../../renderer/materials/instantiatedSkinnedPosedMesh/animation";

export const movePlayer = (world: World) => {
  fromInput(world);
  animation(world);
  directionBlending(world);
  weapons(world);
};

const dir = vec2.create();
const fromInput = (world: World) => {
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

    world.player.state.running = world.player.state.running || world.time;
  } else {
    world.player.state.running = 0;
  }
};

const animation = (world: World) => {
  if (world.player.weapons[0].firing) {
    fillAnimationParams(
      world.animation[EntityKind.player],
      world.entities.poseIndexes,
      world.entities.poseWeights,
      0,
      CharacterAnimation.attack,
      world.time - world.player.weapons[0].firing,
    );
  } else if (world.player.state.running) {
    fillAnimationParams(
      world.animation[EntityKind.player],
      world.entities.poseIndexes,
      world.entities.poseWeights,
      0,
      CharacterAnimation.run,
      world.time - world.player.state.running,
    );
  } else {
    fillAnimationParams(
      world.animation[EntityKind.player],
      world.entities.poseIndexes,
      world.entities.poseWeights,
      0,
      CharacterAnimation.idle,
      world.time,
    );
  }
};

const directionBlending = (world: World) => {
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
};

const weapons = (world: World) => {
  for (let i = world.player.weapons.length; i--; ) {
    world.player.weapons[i].cooldown -= world.dt;

    const weaponDefinition = world.weaponList[world.player.weapons[i].kind];

    if (world.player.weapons[i].firing) {
      const firingDuration = world.time - world.player.weapons[i].firing;

      if (firingDuration > weaponDefinition.firingDuration) {
        world.player.weapons[i].firing = 0;
        world.player.weapons[i].cooldown = weaponDefinition.cooldown;
      }
    } else {
      world.player.weapons[i].cooldown -= world.dt;

      if (world.player.weapons[i].cooldown <= 0) {
        // auto-fire

        world.player.weapons[i].firing = world.time;
      }
    }
  }
};
