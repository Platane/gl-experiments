import { EnemyKind, World } from "../state";

export const spawn = (world: World, entityKind: EnemyKind) => {
  const i = world.enemies.kindIndexes[entityKind][1];

  world.enemies.positions.copyWithin((i + 1) * 2, i * 2);
  world.enemies.directions.copyWithin((i + 1) * 2, i * 2);
  world.enemies.animationIndexes.copyWithin(i + 1, i);
  world.enemies.animationTimes.copyWithin(i + 1, i);
  world.enemies.colorPaletteIndexes.copyWithin(i + 1, i);
  world.enemies.kind.copyWithin(i + 1, i);
  world.enemies.health.copyWithin(i + 1, i);

  world.enemies.kindIndexes[entityKind][1]++;
  for (let k = entityKind + 1; k < world.enemies.kindIndexes.length; k++) {
    world.enemies.kindIndexes[k][0]++;
    world.enemies.kindIndexes[k][1]++;
  }

  world.enemies.kind[i] = entityKind;

  return i;
};

export const remove = (world: World, i: number) => {
  let k = 0;
  for (
    ;
    k < world.enemies.kindIndexes.length &&
    i >= world.enemies.kindIndexes[k][1];
    k++
  );

  world.enemies.kindIndexes[k][1]--;
  k++;

  for (; k < world.enemies.kindIndexes.length; k++) {
    world.enemies.kindIndexes[k][0]--;
    world.enemies.kindIndexes[k][1]--;
  }

  world.enemies.positions.copyWithin(i * 2, (i + 1) * 2);
  world.enemies.directions.copyWithin(i * 2, (i + 1) * 2);
  world.enemies.animationTimes.copyWithin(i, i + 1);
  world.enemies.animationIndexes.copyWithin(i, i + 1);
  world.enemies.colorPaletteIndexes.copyWithin(i, i + 1);
  world.enemies.kind.copyWithin(i, i + 1);
  world.enemies.health.copyWithin(i, i + 1);
};
