import { getUniformLocation } from "../../app/utils/gl";
import { createScreenSpaceProgram } from "../../app/utils/gl-screenSpaceProgram";

import codeFragFill from "./shader-fill.frag?raw";
import codeFragRead from "./shader-read.frag?raw";

export const createIntSamplerTest = ({
  gl,
}: { gl: WebGL2RenderingContext }) => {
  const programFill = createScreenSpaceProgram(gl, codeFragFill);
  const programRead = Object.assign(
    createScreenSpaceProgram(gl, codeFragRead),
    { uniform: { u_texture: 0 as WebGLUniformLocation | null } },
  );
  programRead.uniform.u_texture = getUniformLocation(
    gl,
    programRead.program,
    "u_texture",
  );

  //

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // the color neer to be renderable, internalformat must be one of https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf#page=143&zoom=100,168,666
  // internalformat and type should be coherent ( gl.INT for 32I , gl.SHORT for 16I, gl.BYTE for 8I )
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16I,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    gl.RGBA_INTEGER,
    gl.SHORT,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const draw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.clearBufferiv(gl.COLOR, 0, [0, 0, 0, 0]);

    // fill int texture
    {
      gl.useProgram(programFill.program);
      programFill.draw();
    }

    // read int texture
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      const data = new Int16Array(
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
      console.log(data);
    }

    // read int texture from the shader
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      const TEXTURE_INDEX = 0;
      gl.useProgram(programRead.program);
      gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(programRead.uniform.u_texture, TEXTURE_INDEX);

      programRead.draw();
    }
  };

  const dispose = () => {
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(fbo);

    programFill.dispose();
    programRead.dispose();
  };

  return { draw, dispose };
};

{
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2", {
    antialias: false,
  }) as WebGL2RenderingContext;

  let renderer = createIntSamplerTest({ gl });
  window.onresize = () => {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 0.2);

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    gl.viewport(0, 0, canvas.width, canvas.height);

    renderer.dispose();
    renderer = createIntSamplerTest({ gl });
    renderer.draw();
  };
  (window.onresize as any)();
}
