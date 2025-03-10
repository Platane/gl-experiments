import { createWorld } from "./world/state";
import { createRenderer } from "./world/render";
import { createEventListeners } from "./control/inputs";
import { createOrbitControl } from "./control/orbitCamera";
import { getSharkModel } from "./renderer/geometries/shark";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const world = createWorld();

  createOrbitControl({ canvas }, world.camera);

  createEventListeners(world, { canvas });

  const models = {
    shark: await getSharkModel(),
  };

  const { render } = createRenderer({ gl }, models);

  //
  // loop
  //

  const loop = () => {
    const o = Date.now() / 1000;
    world.player.positions[0] = Math.sin(o) * 1.5;
    world.player.positions[1] = Math.cos(o) * 1.5;
    world.player.directions[0] = Math.sin(o + 3.14 / 2);
    world.player.directions[1] = Math.cos(o + 3.14 / 2);
    world.player.animation.index = 9;
    world.player.animation.time = Date.now() / 1000;

    render(world);

    requestAnimationFrame(loop);
  };

  loop();
})();
