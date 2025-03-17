import { mat4, quat, vec3 } from "gl-matrix";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createInstantiatedSkinnedPosedMeshMaterial } from "../../app/renderer/materials/instantiatedSkinnedPosedMesh";
import {
  getAnimationParamsMap,
  getPosesData,
} from "../../app/renderer/materials/instantiatedSkinnedPosedMesh/animation";
import { loadGLTFwithCache, mergeModels } from "../../gltf-parser/loadGLTF";
import { createWorld, stepWorld, World } from "./stepWorld";
import Stats from "three/examples/jsm/libs/stats.module";
import GUI from "lil-gui";

import WorldStepperWorker from "./worker?worker";

(async () => {
  if (typeof SharedArrayBuffer === "undefined") {
    document.getElementById("log")!.innerText =
      `SharedArrayBuffer is not supported

      window.isSecureContext: ${window.isSecureContext}
      window.crossOriginIsolated: ${window.crossOriginIsolated}
      `;

    return;
  }

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const parts = await loadGLTFwithCache(
    "https://raw.githubusercontent.com/platane/gl-experiments/assets/Mandarin Fish.glb",
    ["MandarinFish_1", "MandarinFish_2", "MandarinFish_3", "MandarinFish_4"],
  );
  const model = { ...parts[0], ...mergeModels(parts) };

  const animationParamsMap = getAnimationParamsMap(model.animations);

  const skinnedMeshMaterial = createInstantiatedSkinnedPosedMeshMaterial(
    { gl },
    { posePerVertex: 2, bonePerVertex: 4 },
  );

  const renderer = skinnedMeshMaterial.createRenderer({
    geometry: {
      positions: model.positions,
      normals: getFlatShadingNormals(model.positions),
      boneWeights: model.boneWeights!,
      boneIndexes: new Uint8Array(model.boneIndexes!),
      boneCount: model.bindPose.length,
      colorCount: model.colorCount!,
      colorIndexes: model.colorIndexes!,
    },
    colorPalettes: new Uint8Array(
      Array.from({ length: 10 }, (_, i) => [
        ...model.colorPalette!.map((a) => a * (1 + i)),
      ]).flat(),
    ),
    poses: getPosesData(model.animations),
  });
  //
  // camera
  //

  const camera = Object.assign(
    createLookAtCamera({ canvas }, { near: 1, far: 100_000 }),
    {
      eye: [1, 30, 60] as vec3,
      lookAt: [0, 0, 0] as vec3,
    },
  );
  createOrbitControl(
    { canvas },
    camera,
    () => camera.update(camera.eye, camera.lookAt),
    { minRadius: 10, maxRadius: 100 },
  );

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dpr: 2 });
    camera.update(camera.eye, camera.lookAt);
  };
  (window.onresize as any)();

  //
  //
  //

  let world: World;

  const worldStepperWorker = new WorldStepperWorker() as Worker;

  const updateWorld = (N: number) => {
    const buffer = new SharedArrayBuffer(N * 35 + 32);
    world = createWorld(N, buffer, animationParamsMap);
    for (let i = world.n; i--; )
      world.colorPaletteIndexes[i] = Math.floor(Math.random() * 10);

    worldStepperWorker.postMessage({
      create: true,
      N,
      buffer,
      animationParamsMap,
    });
  };

  //
  //
  //

  const gui = new GUI();
  const config = {
    worker: true,
    instanceCount: 1000,
    renderPerLoop: 1,
  };

  gui
    .add(
      config,
      "instanceCount",
      [
        //
        1, 500, 1_000, 2_000, 4_000, 10_000,
      ],
    )
    .onChange(() => {
      config.instanceCount = Math.round(config.instanceCount);
      updateWorld(config.instanceCount);
    });
  gui.add(
    config,
    "renderPerLoop",
    [
      //
      1, 2, 4, 8, 16,
    ],
  );

  updateWorld(config.instanceCount);
  gui.add(config, "worker");

  const stats = new Stats();
  stats.dom.style.position = "static";
  stats.dom.style.display = "inline-block";
  gui.domElement.appendChild(stats.dom);

  let startRenderDate = performance.now();

  const loop = async () => {
    world.stats[1] = performance.now() - startRenderDate;

    //

    stats.update();
    document.getElementById("stats")!.innerText =
      `step  : ${world.stats[0].toFixed(1).padStart(5, " ")}ms\nrender: ${world.stats[1].toFixed(1).padStart(5, " ")}ms`;

    //
    //

    if (config.worker) {
      await navigator.locks.request("world-lock", () => {
        renderer.update(world, world.n);
      });

      worldStepperWorker.postMessage({ step: true });
    } else {
      renderer.update(world, world.n);
      stepWorld(world);
    }

    //
    //

    //
    //

    startRenderDate = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let k = config.renderPerLoop; k--; )
      skinnedMeshMaterial.draw(camera.worldMatrix, renderer.render);

    requestAnimationFrame(loop);
  };

  loop();
})();
