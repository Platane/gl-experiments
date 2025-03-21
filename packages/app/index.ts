import { createWorld } from "./world/state";
import { createRenderer } from "./world/render";
import { createEventListeners } from "./control/inputs";
import { createOrbitControl } from "./control/orbitCamera";
import { getSharkModel } from "./renderer/geometries/shark";
import { getTrexModel } from "./renderer/geometries/trex";
import { getVelociraptorModel } from "./renderer/geometries/velociraptor";
import { getParaModel } from "./renderer/geometries/para";
import { updateWorld } from "./world/system";
import { getAnimationParamsMap } from "./renderer/materials/instantiatedSkinnedPosedMesh/animation";
import { createUI } from "./ui";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const world = createWorld();
  world.camera.devicePixelRatio = Math.min(window.devicePixelRatio, 2);
  world.entities.directions[0] = 1;

  createOrbitControl({ canvas }, world.camera);

  createEventListeners(world, { canvas });

  const ui = createUI();
  document.body.appendChild(ui.containerDom);

  const models = {
    shark: await getSharkModel(),
    trex: await getTrexModel(),
    raptor: await getVelociraptorModel(),
    para: await getParaModel(),
  };
  world.animation = [models.shark, models.trex, models.raptor, models.para].map(
    (m) => getAnimationParamsMap(m.animations),
  );

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

    ui.update(world);

    render(world);

    requestAnimationFrame(loop);
  };

  loop();
})();
