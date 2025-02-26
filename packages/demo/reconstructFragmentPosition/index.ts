import { mat4, quat, vec3 } from "gl-matrix";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createBoxGeometry } from "../../app/renderer/geometries/box";
import { createScreenSpaceProgramWithUniforms } from "../../app/utils/gl-screenSpaceProgram";
import { createBasicMeshMaterial } from "../../app/renderer/materials/basicMesh";

import codeFragDebug from "./shader-debug.frag?raw";

const CAMERA_NEAR = 0.5;
const CAMERA_FAR = 2000;

export const createReconstructPositionPass = ({
  gl,
}: { gl: WebGL2RenderingContext }) => {
  //
  // programs
  //

  const programDebug = createScreenSpaceProgramWithUniforms(gl, codeFragDebug, [
    "u_viewportSize",
    "u_viewMatrix",
    "u_viewMatrixInv",
    "u_depthTexture",
    "u_colorTexture",
  ]);

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

  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0,
  );

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const worldMatrixInv = mat4.create();

  const viewportSize = 2;

  const draw = (
    worldMatrix: Float32Array,
    drawScene: () => void,
    {}: {} = {},
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScene();

    mat4.invert(worldMatrixInv, worldMatrix);

    {
      gl.useProgram(programDebug.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.uniform1f(programDebug.uniform.u_viewportSize, viewportSize);

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
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(programDebug.uniform.u_depthTexture, 1);

      programDebug.draw();
    }

    {
      const cx = Math.floor(x * gl.drawingBufferWidth);
      const cy = Math.floor((1 - y) * gl.drawingBufferHeight);
      const data = new Uint8Array(4);
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
        "world position:" +
        "\n" +
        [...data.slice(0, 3)]
          .map((x) => (x / 256) * (viewportSize * 2) - viewportSize)
          .map(fl) +
        "\n" +
        "";
    }
  };

  let x = 0.5;
  let y = 0.5;
  document.body.addEventListener("mousemove", ({ pageX, pageY }) => {
    x = pageX / window.innerWidth;
    y = pageY / window.innerHeight;
  });

  const dispose = () => {
    programDebug.dispose();

    gl.deleteFramebuffer(baseFramebuffer);

    gl.deleteTexture(colorTexture);
    gl.deleteTexture(depthTexture);
  };

  return { draw, dispose };
};

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const boxGeometry = createBoxGeometry();

  const material = createBasicMeshMaterial({ gl });
  const renderer = material.createRenderer({ geometry: boxGeometry });
  const transform = mat4.create();
  mat4.fromScaling(transform, [1.1, 1.2, 1.3]);
  renderer.update(transform as Float32Array, new Float32Array([1.0, 0.4, 0.3]));

  let reconstructPositionPass: ReturnType<typeof createReconstructPositionPass>;

  //
  // camera
  //

  const camera = Object.assign(
    createLookAtCamera({ canvas }, { near: CAMERA_NEAR, far: CAMERA_FAR }),
    {
      eye: [0, 0, 5] as vec3,
      lookAt: [0, 0, 0] as vec3,
    },
  );
  createOrbitControl(
    { canvas },
    camera,
    () => camera.update(camera.eye, camera.lookAt),
    { maxRadius: 9, minRadius: 3.5 },
  );

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dpr: 2 });
    camera.update(camera.eye, camera.lookAt);

    reconstructPositionPass?.dispose();
    reconstructPositionPass = createReconstructPositionPass({ gl });
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

    reconstructPositionPass.draw(camera.worldMatrix as Float32Array, () =>
      material.draw(camera.worldMatrix, [renderer]),
    );

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
