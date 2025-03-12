import { World } from "../state";
import { cameraFollow } from "./camera-follow";
import { moveEnemies, spawnEnemies } from "./move-enemies";
import { movePlayer } from "./move-player";
import { stompEnemies } from "./stomp-enemies";

export const updateWorld = (world: World) => {
  movePlayer(world);
  stompEnemies(world);
  moveEnemies(world);
  spawnEnemies(world);
  cameraFollow(world);
};
