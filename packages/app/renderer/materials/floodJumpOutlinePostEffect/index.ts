import { mat4 } from "gl-matrix";
import { getUniformLocation } from "../../../utils/gl";

import codeJumpFloodInitFrag from "./shader-jumpFloodInit.frag?raw";
import codejumpFloodMarchFrag from "./shader-jumpFloodMarch.frag?raw";
import codejumpFloodLevelFrag from "./shader-jumpFloodLevel.frag?raw";
import codeDisplayTextureFrag from "./shader-displayTexture.frag?raw";
import { createScreenSpaceProgram } from "../../../utils/gl-screenSpaceProgram";
import { createFramebuffer } from "./framebuffer";

export const createOutlinePostEffect = ({
  gl,
}: {
  gl: WebGL2RenderingContext;
}) => {
  const fbo = createFramebuffer(gl);

  ///
  ///
  ///

  const initPass = Object.assign(
    createScreenSpaceProgram(gl, codeJumpFloodInitFrag),
    { uniform: { u_objectIdTexture: 0 } },
  );

  initPass.uniform.u_objectIdTexture = getUniformLocation(
    gl,
    initPass.program,
    "u_objectIdTexture",
  ) as any;

  ///
  ///
  ///

  const marchPass = Object.assign(
    createScreenSpaceProgram(gl, codejumpFloodMarchFrag),
    { uniform: { u_texture: 0, u_offsetSize: 0 } },
  );

  marchPass.uniform.u_texture = getUniformLocation(
    gl,
    marchPass.program,
    "u_texture",
  ) as number;
  // marchPass.uniform.u_textelSize = getUniformLocation(
  //   gl,
  //   marchPass.program,
  //   "u_textelSize",
  // ) as number;
  marchPass.uniform.u_offsetSize = getUniformLocation(
    gl,
    marchPass.program,
    "u_offsetSize",
  ) as number;

  ///
  ///
  ///

  const levelPass = Object.assign(
    createScreenSpaceProgram(gl, codejumpFloodLevelFrag),
    { uniform: { u_texture: 0 } },
  );

  levelPass.uniform.u_texture = getUniformLocation(
    gl,
    levelPass.program,
    "u_texture",
  ) as number;

  ///
  ///
  ///

  const debugPass = Object.assign(
    createScreenSpaceProgram(gl, codeDisplayTextureFrag),
    { uniform: { u_texture: 0 } },
  );

  debugPass.uniform.u_texture = getUniformLocation(
    gl,
    debugPass.program,
    "u_texture",
  ) as any;

  //
  // frame buffer
  //

  const pass1Texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pass1Texture);
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

  // const pass2Texture = gl.createTexture();
  // gl.bindTexture(gl.TEXTURE_2D, pass2Texture);
  // gl.texStorage2D(
  //   gl.TEXTURE_2D,
  //   1,
  //   gl.RGBA16I,
  //   gl.drawingBufferWidth,
  //   gl.drawingBufferHeight,
  // );
  // gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  const pass1FrameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, pass1FrameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    pass1Texture,
    0,
  );
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  // const pass2FrameBuffer = gl.createFramebuffer();
  // gl.bindFramebuffer(gl.FRAMEBUFFER, pass2FrameBuffer);
  // gl.framebufferTexture2D(
  //   gl.FRAMEBUFFER,
  //   gl.COLOR_ATTACHMENT0,
  //   gl.TEXTURE_2D,
  //   pass2Texture,
  //   0,
  // );
  // gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  ///
  ///
  ///

  const draw = (drawObjects: () => void) => {
    //
    // clear
    //

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));

    //
    // draw in the frame buffer
    //
    drawObjects();

    //
    //
    //

    gl.bindFramebuffer(gl.FRAMEBUFFER, pass1FrameBuffer);
    gl.clearBufferiv(gl.COLOR, 0, [0, 0, 0, 0]);

    //

    gl.useProgram(initPass.program);

    gl.uniform1i(initPass.uniform.u_objectIdTexture, 0);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.objectIdTexture);

    initPass.draw();

    //

    // gl.useProgram(marchPass.program);

    // gl.uniform1i(marchPass.uniform.u_texture, 0);
    // gl.activeTexture(gl.TEXTURE0 + 0);

    // const step = 1;
    // gl.uniform2fv(
    //   marchPass.uniform.u_offsetSize,
    //   new Float32Array([
    //     step / gl.drawingBufferWidth,
    //     step / gl.drawingBufferHeight,
    //   ]),
    // );

    // for (let k = 0; k < 26; k++) {
    //   if (k % 2 === 1) {
    //     gl.bindTexture(gl.TEXTURE_2D, pass2Texture);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, pass1FrameBuffer);
    //   } else {
    //     gl.bindTexture(gl.TEXTURE_2D, pass1Texture);
    //     gl.bindFramebuffer(gl.FRAMEBUFFER, pass2FrameBuffer);
    //   }

    //   marchPass.draw();
    // }

    // //

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // gl.useProgram(levelPass.program);

    // gl.activeTexture(gl.TEXTURE0 + 0);
    // gl.bindTexture(gl.TEXTURE_2D, pass2Texture);

    // gl.uniform1i(levelPass.uniform.u_texture, 0);

    // levelPass.draw();
    // //

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(debugPass.program);

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, pass1Texture);

    gl.uniform1i(debugPass.uniform.u_texture, 0);

    debugPass.draw();
    //

    gl.useProgram(null);
  };

  const dispose = () => {
    initPass.dispose();

    fbo.dispose();
  };

  return { draw, dispose };
};
