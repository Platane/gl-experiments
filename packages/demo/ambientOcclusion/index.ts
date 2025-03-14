import GUI from "lil-gui";
import { vec3 } from "gl-matrix";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { loadGLTFwithCache } from "../../gltf-parser/loadGLTF";

import { createBasicMeshMaterial } from "./basicMesh";
import { createAOPass } from "./ao";

const CAMERA_NEAR = 0.5;
const CAMERA_FAR = 10;

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const [modelGeometry] = await loadGLTFwithCache(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",
    ["Dragon"],
  );

  const renderer = createBasicMeshMaterial(
    { gl },
    {
      geometry: {
        positions: modelGeometry.positions,
        normals: modelGeometry.normals!,
      },
    },
  );

  let aoPass: ReturnType<typeof createAOPass>;

  //
  // camera
  //

  const camera = Object.assign(
    createLookAtCamera({ canvas }, { near: CAMERA_NEAR, far: CAMERA_FAR }),
    {
      eye: [0, 0, 4.5] as vec3,
      lookAt: [0, 0, 0] as vec3,
    },
  );

  createOrbitControl(
    { canvas },
    camera,
    () => camera.update(camera.eye, camera.lookAt),
    { maxRadius: 9, minRadius: 3.5 },
  );

  //
  // controls
  //

  const gui = new GUI();
  const config = {
    sampleRadius: 0.2,
    sampleCount: 32,
    textureDownsampling: 2,
    blurRadius: 2,
    noiseTextureSize: 4,
  };

  gui.add(config, "sampleRadius", 0.001, 2);
  gui.add(config, "sampleCount", 1, 128);
  gui.add(config, "textureDownsampling", [1, 2, 4, 8]);
  gui.add(config, "blurRadius", 0, 16, 1);
  gui.add(config, "noiseTextureSize", 1, 64, 1);
  gui.onChange(() => {
    (window.onresize as any)();
  });

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dpr: 2 });
    camera.update(camera.eye, camera.lookAt);

    config.blurRadius = Math.floor(config.blurRadius);
    config.sampleCount = Math.floor(config.sampleCount);
    config.noiseTextureSize = Math.floor(config.noiseTextureSize);
    config.textureDownsampling = Math.floor(config.textureDownsampling);

    gui.controllersRecursive().forEach((c) => c.updateDisplay());

    aoPass?.dispose();
    aoPass = createAOPass({ gl });
  };
  (window.onresize as any)();

  //
  // loop
  //

  const loop = () => {
    //
    // draw
    //
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    aoPass.draw(camera.worldMatrix as Float32Array, () =>
      renderer.draw(camera.worldMatrix),
    );

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
