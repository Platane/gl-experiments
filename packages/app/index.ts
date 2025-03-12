import { createWorld } from "./world/state";
import { createRenderer } from "./world/render";
import { createEventListeners } from "./control/inputs";
import { createOrbitControl } from "./control/orbitCamera";
import { getSharkModel } from "./renderer/geometries/shark";
import { getTrexModel } from "./renderer/geometries/trex";
import { getVelociraptorModel } from "./renderer/geometries/velociraptor";
import { getParaModel } from "./renderer/geometries/para";
import { updateWorld } from "./world/system";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const world = createWorld();
  world.camera.devicePixelRatio = Math.min(window.devicePixelRatio, 2);

  createOrbitControl({ canvas }, world.camera);

  createEventListeners(world, { canvas });

  const models = {
    shark: await getSharkModel(),
    trex: await getTrexModel(),
    raptor: await getVelociraptorModel(),
    para: await getParaModel(),
  };

  const { render } = createRenderer({ gl }, models);

  //
  // loop
  //

  let lastDate = Date.now() / 1000;
  const loop = () => {
    world.dt = Date.now() / 1000 - lastDate;
    lastDate += world.dt;

    world.time += world.dt;

    updateWorld(world);

    render(world);

    requestAnimationFrame(loop);
  };

  loop();
})();
