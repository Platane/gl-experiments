import { expect, it, describe } from "bun:test";
import { createWorld, EntityKind } from "../../state";
import { addEntity, removeEntity } from "../enemyListHelper";

describe("entity list", () => {
  it("should restore to initial state with add / remove", () => {
    const world = createWorld();
    addEntity(world, EntityKind.para);
    addEntity(world, EntityKind.trex);

    removeEntity(world, 1);
    removeEntity(world, 1);

    expect(world).toEqual(createWorld());
  });

  it("should add / remove", () => {
    const world = createWorld();

    {
      const i = addEntity(world, EntityKind.raptor);
      world.entities.health[i] = 10;
    }
    {
      const i = addEntity(world, EntityKind.trex);
      world.entities.health[i] = 8;
    }
    {
      const i = addEntity(world, EntityKind.trex);
      world.entities.health[i] = 7;
    }

    const list = Array.from(
      { length: world.entities.kindIndexes.at(-1)! },
      (_, i) => ({
        kind: world.entities.kind[i],
        health: world.entities.health[i],
      }),
    );

    expect(list).toEqual([
      {
        health: 0,
        kind: 0,
      },
      {
        health: 8,
        kind: 1,
      },
      {
        health: 7,
        kind: 1,
      },
      {
        health: 10,
        kind: 2,
      },
    ]);
  });
});
