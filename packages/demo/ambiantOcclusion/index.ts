import { mat4, quat, vec3 } from "gl-matrix";
import {
  CAMERA_NEAR,
  CAMERA_FAR,
  createLookAtCamera,
  resizeViewport,
} from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createScreenSpaceProgramWithUniforms } from "../../app/utils/gl-screenSpaceProgram";
import { loadGLTFwithCache } from "../../gltf-parser";

import codeFragDebug from "./shader-debug.frag?raw";
import { createBasicMeshMaterial } from "./basicMesh";

const createAOPass = ({ gl }: { gl: WebGL2RenderingContext }) => {
  //
  // programs
  //

  const programDebug = createScreenSpaceProgramWithUniforms(gl, codeFragDebug, [
    "u_colorTexture",
    "u_depthTexture",
    "u_normalTexture",
    "u_far",
    "u_near",
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
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.DEPTH24_STENCIL8,
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

  const draw = (drawScene: () => void, {}: {} = {}) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScene();

    // read int texture
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);

      const data = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      );
      gl.readBuffer(gl.COLOR_ATTACHMENT0);
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
        gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
        data,
      );
    }

    // debug pass
    {
      gl.useProgram(programDebug.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.uniform1f(programDebug.uniform.u_near, CAMERA_NEAR);
      gl.uniform1f(programDebug.uniform.u_far, CAMERA_FAR);

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
    }
  };

  const dispose = () => {};

  return { draw, dispose };
};

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const geometry = await loadGLTFwithCache(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
    "node_damagedHelmet_-6514",
  );

  const renderer = createBasicMeshMaterial(
    { gl },
    { geometry: { positions: geometry.positions, normals: geometry.normals! } },
  );

  let aoPass: ReturnType<typeof createAOPass>;

  //
  // camera
  //

  const camera = Object.assign(createLookAtCamera({ canvas }), {
    eye: [0, 0, 2.5] as vec3,
    lookAt: [0, 0, 0] as vec3,
  });
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
      localStorage.setItem(
        "camera." + location.pathname,
        JSON.stringify({ eye: camera.eye, lookAt: camera.lookAt }),
      );
    },
    { maxRadius: 8, minRadius: 1.2 },
  );

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dpr: 1 });
    camera.update(camera.eye, camera.lookAt);

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

    aoPass.draw(() => renderer.draw(camera.worldMatrix));

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
