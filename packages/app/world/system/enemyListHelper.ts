import { EntityKind, World } from "../state";

export const addEntity = (world: World, entityKind: EntityKind) => {
  const i = world.entities.kindIndexes[entityKind];

  world.entities.positions.copyWithin((i + 1) * 2, i * 2);
  world.entities.directions.copyWithin((i + 1) * 2, i * 2);
  world.entities.animationIndexes.copyWithin(i + 1, i);
  world.entities.animationTimes.copyWithin(i + 1, i);
  world.entities.colorPaletteIndexes.copyWithin(i + 1, i);
  world.entities.kind.copyWithin(i + 1, i);
  world.entities.health.copyWithin(i + 1, i);
  world.entities.boundingCircleRadius.copyWithin(i + 1, i);

  for (let k = entityKind; k < world.entities.kindIndexes.length; k++)
    world.entities.kindIndexes[k]++;

  world.entities.kind[i] = entityKind;

  return i;
};

export const removeEntity = (world: World, i: number) => {
  let k = 0;
  for (
    ;
    k < world.entities.kindIndexes.length && i >= world.entities.kindIndexes[k];
    k++
  );

  for (; k < world.entities.kindIndexes.length; k++)
    world.entities.kindIndexes[k]--;

  world.entities.positions.copyWithin(i * 2, (i + 1) * 2);
  world.entities.directions.copyWithin(i * 2, (i + 1) * 2);
  world.entities.animationTimes.copyWithin(i, i + 1);
  world.entities.animationIndexes.copyWithin(i, i + 1);
  world.entities.colorPaletteIndexes.copyWithin(i, i + 1);
  world.entities.kind.copyWithin(i, i + 1);
  world.entities.health.copyWithin(i, i + 1);
  world.entities.boundingCircleRadius.copyWithin(i + 1, i);
};
