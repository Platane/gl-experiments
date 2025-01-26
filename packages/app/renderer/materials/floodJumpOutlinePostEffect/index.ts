import { mat4 } from "gl-matrix";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  linkProgram,
} from "../../../utils/gl";
import { CAMERA_FAR, CAMERA_NEAR } from "../../camera";

import codeFrag from "./shader.frag?raw";
import codeVert from "../../../utils/gl-screenSpaceProgram/shader-quad.vert?raw";
import { createScreenSpaceProgram } from "../../../utils/gl-screenSpaceProgram";

export const createOutlinePostEffect = ({
  gl,
}: {
  gl: WebGL2RenderingContext;
}) => {
  // return createScreenSpaceProgram(gl, codeFrag);

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

  const initPass = createScreenSpaceProgram(gl, codeFrag);

  //
  // uniforms
  //
  const u_objectIdTexture = getUniformLocation(
    gl,
    initPass.program,
    "u_objectIdTexture",
  );

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
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );
  const pass2Texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pass2Texture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
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

    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);

    gl.useProgram(initPass.program);

    gl.uniform1i(u_objectIdTexture, 0);

    initPass.draw();

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
