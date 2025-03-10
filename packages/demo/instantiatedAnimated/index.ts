import { mat4, quat, vec3 } from "gl-matrix";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createInstantiatedSkinnedPosedMeshMaterial } from "../../app/renderer/materials/instantiatedSkinnedPosedMesh";
import { computeWeights } from "../../app/utils/bones";
import { createAnimationParamsGetter } from "../../app/renderer/materials/instantiatedSkinnedPosedMesh/animation";
import { lerp } from "../../app/utils/math";
import { loadGLTFwithCache } from "../../gltf-parser/loadGLTF";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module";

// @ts-ignore
import hash from "hash-int";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const skinnedMeshMaterial = createInstantiatedSkinnedPosedMeshMaterial({
    gl,
  });

  const model_glb =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Fox/glTF-Binary/Fox.glb";
  const {
    positions,
    bindPose,
    animations,
    colorCount,
    colorIndexes,
    colorPalette,
  } = await loadGLTFwithCache(model_glb, "fox", { colorEqualsThreehold: 150 });

  const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const animationParams = createAnimationParamsGetter(animations as any);

  const foxRenderer = skinnedMeshMaterial.createRenderer({
    geometry: {
      positions,
      normals: getFlatShadingNormals(positions),
      boneWeights,
      boneIndexes,
      boneCount: bindPose.length,
      colorCount: colorCount!,
      colorIndexes: colorIndexes!,
    },
    colorPalettes: new Uint8Array([
      ...colorPalette!,

      ...Array.from({ length: 29 }, (_, i) => {
        const r = 80 + (hash(i + 31289) % 160);
        const g = 80 + (hash(i + 1823) % 160);
        const b = 80 + (hash(i + 5189) % 160);

        // biome-ignore format: better
        return [
          254, 248, 242,
          r,   g,   b,
          40,  40,  40,
        ]
      }).flat(),
    ]),
    poses: animationParams.poses,
  });
  //
  // camera
  //

  const camera = Object.assign(
    createLookAtCamera({ canvas }, { near: 1, far: 100_000 }),
    {
      eye: [1, 500, 800] as vec3,
      lookAt: [0, 70, 0] as vec3,
    },
  );
  createOrbitControl(
    { canvas },
    camera,
    () => camera.update(camera.eye, camera.lookAt),
    { minRadius: 1000, maxRadius: 5_000 },
  );

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dprMax: 1 });
    camera.update(camera.eye, camera.lookAt);
  };
  (window.onresize as any)();

  //
  // logic
  //

  const N = 1 << 16;
  const world = {
    positions: new Float32Array(N * 2),
    directions: new Float32Array(N * 2),
    poseIndexes: new Uint8Array(N * 2),
    poseWeights: new Float32Array(N * 2),
    colorPaletteIndexes: new Uint8Array(
      Array.from({ length: N }, (_, i) => hash(i + 312) % 30),
    ),
    animations: Array.from({ length: N }, (_, i) => ({
      index: 1 + (hash(i + 3081) % 2),
      time: 0,
    })),
    entropies: Array.from({ length: N }, (_, i) => {
      const A = lerp(1 - ((hash(i + 31233) % 4823) / 4823) ** 2, 300, 8000);

      const angleOffset = ((hash(i + 5891) % 631) / 631) * Math.PI * 2;

      const timingOffset = hash(i + 31783) % 5000;

      return { A, angleOffset, timingOffset };
    }),
  };

  //
  //
  //
  const gui = new GUI();
  const config = {
    instanceCount: 1 << 12,
  };

  gui.add(config, "instanceCount", [1, 1 << 4, 1 << 12, 1 << 14, 1 << 15]);
  gui.onChange(() => {
    config.instanceCount = Math.round(config.instanceCount);
  });
  const stats = new Stats();
  stats.dom.style.margin = "4px";
  stats.dom.style.height = "48px";
  stats.dom.style.position = "static";
  gui.domElement.appendChild(stats.dom);

  const loop = () => {
    stats.update();

    const t = Date.now() / 1000;
    for (let i = config.instanceCount; i--; ) {
      const { A, angleOffset, timingOffset } = world.entropies[i];

      const angle = t / (A / 90) + angleOffset;

      world.positions[i * 2 + 0] = Math.sin(angle) * A;
      world.positions[i * 2 + 1] = Math.cos(angle) * A;

      world.directions[i * 2 + 0] = Math.sin(angle + Math.PI / 2);
      world.directions[i * 2 + 1] = Math.cos(angle + Math.PI / 2);

      world.animations[i].time = t + timingOffset;
    }
    animationParams.applyAnimationParams(world, world.animations);

    //
    //

    foxRenderer.update(
      world.positions,
      world.directions,
      world.poseIndexes,
      world.poseWeights,
      world.colorPaletteIndexes,
      config.instanceCount,
    );

    //
    //

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    skinnedMeshMaterial.draw(camera.worldMatrix, [foxRenderer]);

    requestAnimationFrame(loop);
  };

  loop();
})();
