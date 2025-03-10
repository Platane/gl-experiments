import { vec2 } from "gl-matrix";
import { World } from "../state";

export const cameraFollow = (world: World) => {
  world.camera.eye[0] = world.player.positions[0];
  world.camera.eye[1] = 4;
  world.camera.eye[2] = world.player.positions[1] + 5;

  world.camera.lookAt[0] = world.player.positions[0];
  world.camera.lookAt[1] = 1;
  world.camera.lookAt[2] = world.player.positions[1];
};
