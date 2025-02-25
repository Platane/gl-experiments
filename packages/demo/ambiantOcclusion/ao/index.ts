import { mat4, quat, vec3 } from "gl-matrix";
import { createScreenSpaceProgramWithUniforms } from "../../../app/utils/gl-screenSpaceProgram";

import codeFragDebug from "./shader-debug.frag?raw";

/**
 * references:
 * - https://medium.com/better-programming/depth-only-ssao-for-forward-renderers-1a3dcfa1873a
 * - http://john-chapman-graphics.blogspot.com/2013/01/ssao-tutorial.html
 */
export const createAOPass = (
  { gl }: { gl: WebGL2RenderingContext },
  {
    sampleCount = 64,
    sampleRadius = 0.1,
    cameraFar = 10,
    cameraNear = 1,
  }: {
    sampleCount?: number;
    sampleRadius?: number;
    cameraFar?: number;
    cameraNear?: number;
  } = {},
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
      "u_noiseTexture",
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
        // y = -Math.random();
        z = Math.random() * 2 - 1;
      }
      return [x, y, z];
    }).flat(),
  );

  const noiseTexture = gl.createTexture();
  const noiseTextureSize = 8;
  const noise = new Float32Array(
    Array.from({ length: noiseTextureSize * noiseTextureSize * 3 }, () => [
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      0,
    ]).flat(),
  );
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.RGB32F, // internal format
    noiseTextureSize,
    noiseTextureSize,
    0, // border
    gl.RGB, // format
    gl.FLOAT, // type
    noise,
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

      gl.uniform1f(programDebug.uniform.u_near, cameraNear);
      gl.uniform1f(programDebug.uniform.u_far, cameraFar);
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

      gl.activeTexture(gl.TEXTURE0 + 4);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.uniform1i(programDebug.uniform.u_noiseTexture, 4);

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

  const dispose = () => {
    programDebug.dispose();

    gl.deleteFramebuffer(baseFramebuffer);

    gl.deleteTexture(colorTexture);
    gl.deleteTexture(normalTexture);
    gl.deleteTexture(depthTexture);
    gl.deleteTexture(noiseTexture);
  };

  return { draw, dispose };
};
