import { createWorld } from "./world/state";
import { createRenderer } from "./world/render";
import { createEventListeners } from "./control/inputs";
import { createOrbitControl } from "./control/orbitCamera";
import { getSharkModel } from "./renderer/geometries/shark";
import { movePlayer } from "./world/system/move-player";
import { cameraFollow } from "./world/system/camera-follow";
import { moveEnemies } from "./world/system/move-enemies";
import { getTrexModel } from "./renderer/geometries/trex";
import { getVelociraptorModel } from "./renderer/geometries/velociraptor";
import { getParaModel } from "./renderer/geometries/para";
import { stompEnemies } from "./world/system/stomp-enemies";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const world = createWorld();

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

  const startDate = Date.now();
  const loop = () => {
    world.time = (Date.now() - startDate) / 1000;

    movePlayer(world);
    stompEnemies(world);
    moveEnemies(world);
    cameraFollow(world);

    //

    render(world);

    requestAnimationFrame(loop);
  };

  loop();
})();
