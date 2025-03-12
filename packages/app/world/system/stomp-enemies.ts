import { vec2 } from "gl-matrix";
import { characterAnimation, World } from "../state";
import { removeEntity } from "./enemyListHelper";

const p = vec2.create();
const e = vec2.create();
export const stompEnemies = (world: World) => {
  p[0] = world.entities.positions[0];
  p[1] = world.entities.positions[1];

  const enemyCount = world.entities.kindIndexes.at(-1)!;
  for (let i = enemyCount; i >= 1; i--) {
    e[0] = world.entities.positions[i * 2 + 0];
    e[1] = world.entities.positions[i * 2 + 1];

    const d = vec2.distance(e, p);
    if (d < 0.5) {
      removeEntity(world, i);
    }
  }
};
