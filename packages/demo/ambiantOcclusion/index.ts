import { mat4, quat, vec3 } from "gl-matrix";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createScreenSpaceProgramWithUniforms } from "../../app/utils/gl-screenSpaceProgram";
import { loadGLTFwithCache } from "../../gltf-parser";

import codeFragDebug from "./shader-debug.frag?raw";
import { createBasicMeshMaterial } from "./basicMesh";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBoxGeometry } from "../../app/renderer/geometries/box";

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

/**
 * references:
 * - https://medium.com/better-programming/depth-only-ssao-for-forward-renderers-1a3dcfa1873a
 * - http://john-chapman-graphics.blogspot.com/2013/01/ssao-tutorial.html
 */
const createAOPass = (
  { gl }: { gl: WebGL2RenderingContext },
  {
    sampleCount = 64,
    sampleRadius = 0.1,
  }: { sampleCount?: number; sampleRadius?: number } = {},
) => {
  //
  // programs
  //

  const programDebug = createScreenSpaceProgramWithUniforms(
    gl,
    codeFragDebug.replace("SAMPLE_COUNT", sampleCount),
    [
      "u_colorTexture",
      "u_depthTexture",
      "u_normalTexture",
      "u_far",
      "u_near",
      "u_sampleRadius",
      "u_kernel",
      "u_viewMatrix",
      "u_viewMatrixInv",
      "u_size",
    ],
  );

  //
  // framebuffer to store depth and color
  //

  const colorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const normalTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, normalTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.DEPTH_COMPONENT32F,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const baseFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT1,
    gl.TEXTURE_2D,
    normalTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0,
  );

  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //
  // init kernel
  //
  const kernel = new Float32Array(
    Array.from({ length: sampleCount }, () => {
      let x = 1;
      let y = 1;
      let z = 1;
      let l = 0;
      while (((l = Math.hypot(x, y, z)), l > 1 || l <= 0)) {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
      }
      return [x, y, z];
    }).flat(),
  );

  const worldMatrixInv = mat4.create();

  const draw = (
    worldMatrix: Float32Array,
    drawScene: () => void,
    {}: {} = {},
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScene();

    mat4.invert(worldMatrixInv, worldMatrix);

    const size = 3;

    // debug pass
    {
      gl.useProgram(programDebug.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.uniform1f(programDebug.uniform.u_near, CAMERA_NEAR);
      gl.uniform1f(programDebug.uniform.u_far, CAMERA_FAR);
      gl.uniform1f(programDebug.uniform.u_sampleRadius, sampleRadius);
      gl.uniform3fv(programDebug.uniform.u_kernel, kernel);
      gl.uniform1f(programDebug.uniform.u_size, size);
      gl.uniformMatrix4fv(
        programDebug.uniform.u_viewMatrix,
        false,
        worldMatrix,
      );
      gl.uniformMatrix4fv(
        programDebug.uniform.u_viewMatrixInv,
        false,
        worldMatrixInv,
      );

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.uniform1i(programDebug.uniform.u_colorTexture, 0);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.uniform1i(programDebug.uniform.u_normalTexture, 1);

      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(programDebug.uniform.u_depthTexture, 2);

      programDebug.draw();

      {
        const cx = Math.floor(x * gl.drawingBufferWidth);
        const cy = Math.floor((1 - y) * gl.drawingBufferHeight);
        const data = new Uint8Array(
          gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(
          cx,
          cy,
          1,
          1,
          gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
          gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
          data,
        );

        const fl = (x: number) => {
          const l = x.toFixed(2);
          return " ".repeat(5 - l.length) + l;
        };
        document.getElementById("log")!.innerText =
          "pointer position:" +
          "\n" +
          "x:" +
          fl(x) +
          ", " +
          "y:" +
          fl(y) +
          "\n\n" +
          [...data.slice(0, 3)]
            .map((x) => (x / 256) * (size * 2) - size)
            .map(fl) +
          "\n" +
          // [...data.slice(0, 3)].map((x) => x / 256).map(fl) +
          "";
      }
    }
  };

  let x = 0.5;
  let y = 0.5;
  document.body.addEventListener("mousemove", ({ pageX, pageY }) => {
    x = pageX / window.innerWidth;
    y = pageY / window.innerHeight;
  });

  const dispose = () => {};

  return { draw, dispose };
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
      // geometry: modelGeometry,
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
    aoPass = createAOPass({ gl }, { sampleRadius, sampleCount });
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
