import { mat4 } from "gl-matrix";
import { getUniformLocation } from "../../../utils/gl";

import codeJumpFloodInitFrag from "./shader-jumpFloodInit.frag?raw";
import codejumpFloodMarchFrag from "./shader-jumpFloodMarch.frag?raw";
import codejumpFloodLevelFrag from "./shader-jumpFloodLevel.frag?raw";
import codeDisplayTextureFrag from "./shader-displayTexture.frag?raw";
import { createScreenSpaceProgram } from "../../../utils/gl-screenSpaceProgram";

export const createOutlinePostEffect = ({
  gl,
}: {
  gl: WebGL2RenderingContext;
}) => {
  const DEPTH_TEXTURE_INDEX = 0;
  const COLOR_TEXTURE_INDEX = 1;
  const NORMAL_TEXTURE_INDEX = 2;
  const OBJECTID_TEXTURE_INDEX = 3;

  gl.activeTexture(gl.TEXTURE0);

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

  var depthTexture = gl.createTexture();
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

  const objectIdTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  gl.bindTexture(gl.TEXTURE_2D, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
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
    gl.COLOR_ATTACHMENT2,
    gl.TEXTURE_2D,
    objectIdTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0,
  );

  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2,
  ]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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
  const PASS1_TEXTURE_INDEX = 4;
  const PASS2_TEXTURE_INDEX = 5;

  gl.activeTexture(gl.TEXTURE0 + PASS1_TEXTURE_INDEX);

  const pass1Texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pass1Texture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGB10_A2, // need to be color renderable : https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf#page=143&zoom=100,168,666
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );
  const pass2Texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pass2Texture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGB10_A2,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

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

  const pass2FrameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, pass2FrameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    pass2Texture,
    0,
  );
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  ///
  ///
  ///

  const draw = (drawObjects: () => void) => {
    // copy the default depth buffer to the fbo depth buffer
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbo);
    gl.clear(gl.DEPTH_BUFFER_BIT); // indeed unnecessary, but since the blit is broken on ff..
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );

    // clear the frame buffer
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));

    //
    // draw in the frame buffer
    //
    drawObjects();

    // copy the fbo depth buffer to the default framebuffer depth buffer
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );

    //
    //
    //

    gl.bindFramebuffer(gl.FRAMEBUFFER, pass1FrameBuffer);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    // gl.clearBufferiv(gl.COLOR, 0, [0, 0, 0, 0]);

    //

    gl.useProgram(initPass.program);

    gl.uniform1i(initPass.uniform.u_objectIdTexture, 0);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);

    initPass.draw();

    //

    gl.useProgram(marchPass.program);

    gl.uniform1i(marchPass.uniform.u_texture, 0);
    gl.activeTexture(gl.TEXTURE0 + 0);

    const step = 1;
    gl.uniform2fv(
      marchPass.uniform.u_offsetSize,
      new Float32Array([
        step / gl.drawingBufferWidth,
        step / gl.drawingBufferHeight,
      ]),
    );

    for (let k = 0; k < 26; k++) {
      if (k % 2 === 1) {
        gl.bindTexture(gl.TEXTURE_2D, pass2Texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, pass1FrameBuffer);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, pass1Texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, pass2FrameBuffer);
      }

      marchPass.draw();
    }

    //

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(levelPass.program);

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, pass2Texture);

    gl.uniform1i(levelPass.uniform.u_texture, 0);

    levelPass.draw();
    //

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // gl.useProgram(debugPass.program);

    // gl.activeTexture(gl.TEXTURE0 + 0);
    // gl.bindTexture(gl.TEXTURE_2D, pass2Texture);

    // gl.uniform1i(debugPass.uniform.u_texture, 0);

    // debugPass.draw();
    // //

    gl.useProgram(null);
  };

  const dispose = () => {
    initPass.dispose();

    gl.deleteFramebuffer(fbo);

    gl.deleteTexture(depthTexture);
    gl.deleteTexture(colorTexture);
    gl.deleteTexture(normalTexture);
    gl.deleteTexture(objectIdTexture);
  };

  return { draw, dispose };
};
