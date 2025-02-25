import { mat4, quat, vec3 } from "gl-matrix";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { loadGLTFwithCache } from "../../gltf-parser";

import { createBasicMeshMaterial } from "./basicMesh";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBoxGeometry } from "../../app/renderer/geometries/box";
import { createAOPass } from "./ao";

const CAMERA_NEAR = 0.5;
const CAMERA_FAR = 8;

const applyMat4 = (m: mat4, points: Float32Array) => {
  const copy = new Float32Array(points.length);

  const v = vec3.create();
  for (let k = points.length / 3; k--; ) {
    v[0] = points[k * 3 + 0];
    v[1] = points[k * 3 + 1];
    v[2] = points[k * 3 + 2];

    vec3.transformMat4(v, v, m);

    copy[k * 3 + 0] = v[0];
    copy[k * 3 + 1] = v[1];
    copy[k * 3 + 2] = v[2];
  }

  return copy;
};

const rotateGeometry = ({
  positions,
  normals,
}: { positions: Float32Array; normals: Float32Array }) => {
  const m = mat4.create();
  mat4.rotateX(m, m, Math.PI / 2);

  return { positions: applyMat4(m, positions), normals: applyMat4(m, normals) };
};

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const modelGeometry = rotateGeometry(
    (await loadGLTFwithCache(
      // "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
      // "node_damagedHelmet_-6514",
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",
      "Dragon",
    )) as { normals: Float32Array; positions: Float32Array },
  );

  const boxGeometry = createBoxGeometry();

  const sphereGeometry = (() => {
    const positions = new Float32Array(
      createRecursiveSphere({ tesselatationStep: 6 }),
    );
    return { positions: positions, normals: positions };
  })();

  const renderer = createBasicMeshMaterial(
    { gl },
    {
      // geometry: boxGeometry,
      geometry: {
        positions: modelGeometry.positions.map((u) => u * 0.24),
        normals: modelGeometry.normals,
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
  try {
    Object.assign(
      camera,
      JSON.parse(localStorage.getItem("camera." + location.pathname) ?? ""),
    );
  } catch (e) {}
  createOrbitControl(
    { canvas },
    camera,
    () => {
      camera.update(camera.eye, camera.lookAt);
      // localStorage.setItem(
      //   "camera." + location.pathname,
      //   JSON.stringify({ eye: camera.eye, lookAt: camera.lookAt }),
      // );
    },
    { maxRadius: 6, minRadius: 4.5 },
  );

  let sampleRadius = 0.2;
  let sampleCount = 64;

  const update = () => {
    document.getElementById("controls-sample-radius-value")!.innerText =
      sampleRadius.toFixed(2);
    (document.getElementById("controls-sample-radius") as any).value =
      sampleRadius;
  };
  update();
  document
    .getElementById("controls-sample-radius")
    ?.addEventListener("input", (e) => {
      sampleRadius = +(e.target as any).value;
      update();
      (window.onresize as any)();
    });

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dpr: 2 });
    camera.update(camera.eye, camera.lookAt);

    aoPass?.dispose();
    aoPass = createAOPass(
      { gl },
      {
        sampleRadius,
        sampleCount,
        cameraFar: CAMERA_FAR,
        cameraNear: CAMERA_NEAR,
      },
    );
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
