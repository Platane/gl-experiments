import { mat4, quat, vec3 } from "gl-matrix";
import { createScreenSpaceProgramWithUniforms } from "../../../app/utils/gl-screenSpaceProgram";

import codeFragBlur from "./shader-blur.frag?raw";
import codeFragComposition from "./shader-composition.frag?raw";
import codeFragAmbientOcclusion from "./shader-computeAmbientOcclusion.frag?raw";

/**
 * references:
 * - https://medium.com/better-programming/depth-only-ssao-for-forward-renderers-1a3dcfa1873a
 * - http://john-chapman-graphics.blogspot.com/2013/01/ssao-tutorial.html
 *
 * to improve:
 *  - use a int format for the noise texture
 *  - use a uint format for the ao textures
 *  - better blur pass
 */
export const createAOPass = (
  { gl }: { gl: WebGL2RenderingContext },
  {
    noiseTextureSize = 4,
    textureDownsampling = 2,
    sampleCount = 32,
    sampleRadius = 0.1,
    blurRadius = noiseTextureSize,
  }: {
    noiseTextureSize?: number;
    textureDownsampling?: number;
    sampleCount?: number;
    sampleRadius?: number;
    blurRadius?: number;
  } = {},
) => {
  //
  // programs
  //

  const programComposition = createScreenSpaceProgramWithUniforms(
    gl,
    codeFragComposition,
    [
      "u_depthTexture",
      "u_colorTexture",
      "u_normalTexture",
      "u_ambientOcclusionTexture",
    ],
  );

  const programAmbientOcclusion = createScreenSpaceProgramWithUniforms(
    gl,
    codeFragAmbientOcclusion.replace("SAMPLE_COUNT", sampleCount),
    [
      "u_depthTexture",
      "u_normalTexture",
      "u_noiseTexture",
      "u_sampleRadius",
      "u_kernel",
      "u_viewMatrix",
      "u_viewMatrixInv",
    ],
  );

  const programBlur = createScreenSpaceProgramWithUniforms(gl, codeFragBlur, [
    "u_texture",
    "u_blurRadius",
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

  //
  // framebuffer to store the ambient occlusion
  //

  const baseDrawingBufferWidth = gl.drawingBufferWidth;
  const baseDrawingBufferHeight = gl.drawingBufferHeight;

  const aoBufferWidth = Math.ceil(baseDrawingBufferWidth / textureDownsampling);
  const aoBufferHeight = Math.ceil(
    baseDrawingBufferHeight / textureDownsampling,
  );

  const ambientOcclusionTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, ambientOcclusionTexture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, aoBufferWidth, aoBufferHeight);

  const ambientOcclusionFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, ambientOcclusionFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    ambientOcclusionTexture,
    0,
  );

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  const ambientOcclusionBlurredTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, ambientOcclusionBlurredTexture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, aoBufferWidth, aoBufferHeight);

  const ambientOcclusionBlurredFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, ambientOcclusionBlurredFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    ambientOcclusionBlurredTexture,
    0,
  );

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

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
        y = Math.random();
        z = Math.random() * 2 - 1;
      }
      return [x, y, z];
    }).flat(),
  );

  const noiseTexture = gl.createTexture();
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
    gl.RGB16F, // internal format
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

    // ao pass
    {
      gl.useProgram(programAmbientOcclusion.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, ambientOcclusionFramebuffer);

      gl.uniform1f(
        programAmbientOcclusion.uniform.u_sampleRadius,
        sampleRadius,
      );
      gl.uniform3fv(programAmbientOcclusion.uniform.u_kernel, kernel);
      gl.uniformMatrix4fv(
        programAmbientOcclusion.uniform.u_viewMatrix,
        false,
        worldMatrix,
      );
      gl.uniformMatrix4fv(
        programAmbientOcclusion.uniform.u_viewMatrixInv,
        false,
        worldMatrixInv,
      );

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.uniform1i(programAmbientOcclusion.uniform.u_normalTexture, 0);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(programAmbientOcclusion.uniform.u_depthTexture, 1);

      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.uniform1i(programAmbientOcclusion.uniform.u_noiseTexture, 2);

      gl.viewport(0, 0, aoBufferWidth, aoBufferHeight);
      programAmbientOcclusion.draw();
    }

    // blur pass
    {
      gl.useProgram(programBlur.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, ambientOcclusionBlurredFramebuffer);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, ambientOcclusionTexture);
      gl.uniform1i(programBlur.uniform.u_texture, 0);

      gl.uniform1i(programBlur.uniform.u_blurRadius, blurRadius);

      gl.viewport(0, 0, aoBufferWidth, aoBufferHeight);
      programBlur.draw();
    }

    // composition pass
    {
      gl.useProgram(programComposition.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.uniform1i(programComposition.uniform.u_colorTexture, 0);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.uniform1i(programComposition.uniform.u_normalTexture, 1);

      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(programComposition.uniform.u_depthTexture, 2);

      gl.activeTexture(gl.TEXTURE0 + 3);
      gl.bindTexture(gl.TEXTURE_2D, ambientOcclusionBlurredTexture);
      gl.uniform1i(programComposition.uniform.u_ambientOcclusionTexture, 3);

      gl.viewport(0, 0, baseDrawingBufferWidth, baseDrawingBufferHeight);
      programComposition.draw();
    }
  };

  const dispose = () => {
    programComposition.dispose();

    gl.deleteFramebuffer(baseFramebuffer);

    gl.deleteTexture(colorTexture);
    gl.deleteTexture(normalTexture);
    gl.deleteTexture(depthTexture);
    gl.deleteTexture(noiseTexture);
  };

  return { draw, dispose };
};
