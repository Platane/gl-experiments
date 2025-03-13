import { vec2 } from "gl-matrix";
import { World } from "../state";

export const cameraFollow = (world: World) => {
  const px = world.entities.positions[0];
  const py = world.entities.positions[1];

  world.camera.eye[0] = px;
  world.camera.eye[1] = 6;
  world.camera.eye[2] = py + 5;

  world.camera.lookAt[0] = px;
  world.camera.lookAt[1] = 1;
  world.camera.lookAt[2] = py;
};
