import { mat4, quat, vec3 } from "gl-matrix";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createInstantiatedSkinnedPosedMeshMaterial } from "../../app/renderer/materials/instantiatedSkinnedPosedMesh";
import {
  fillAnimationParams,
  getAnimationParamsMap,
  getPosesData,
} from "../../app/renderer/materials/instantiatedSkinnedPosedMesh/animation";
import { loadGLTFwithCache, mergeModels } from "../../gltf-parser/loadGLTF";
import { createWorld, stepWorld } from "./stepWorld";

// @ts-ignore
import hash from "hash-int";

(async () => {
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
    resizeViewport({ gl, canvas }, { dprMax: 1 });
    camera.update(camera.eye, camera.lookAt);
  };
  (window.onresize as any)();

  const N = 1 << 10;
  const world = createWorld(N);
  world.t = Date.now() / 1000;
  for (let i = world.n; i--; ) {
    world.colorPaletteIndexes[i] = Math.floor(Math.random() * 10);
  }

  const loop = () => {
    world.dt = Date.now() / 1000 - world.t;
    world.t += world.dt;

    stepWorld(world);

    //
    //

    for (let i = world.n; i--; )
      fillAnimationParams(
        animationParamsMap,
        world.poseIndexes,
        world.poseWeights,
        i * 2,
        4,
        world.t + i * 0.12,
      );

    //
    //

    renderer.update(world, world.n);

    //
    //

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    skinnedMeshMaterial.draw(camera.worldMatrix, renderer.render);

    requestAnimationFrame(loop);
  };

  loop();
})();
