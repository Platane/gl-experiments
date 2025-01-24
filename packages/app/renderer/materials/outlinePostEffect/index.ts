import { mat4 } from "gl-matrix";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  linkProgram,
} from "../../../utils/gl";
import { CAMERA_FAR, CAMERA_NEAR } from "../../camera";

import codeFrag from "./shader.frag?raw";
import codeVert from "./shader.vert?raw";

/**
* post effect
* renderers should populate
* ```glsl
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;
layout(location = 2) out vec4 outObjectId;
* ```
 */
export const createOutlinePostEffect = ({
  gl,
}: {
  gl: WebGL2RenderingContext;
}) => {
  const program = createProgram(gl, codeVert, codeFrag);
  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);
  linkProgram(gl, program);

  {
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

    // interleaved position and texCoord
    const quadData = new Float32Array([
      -1, 1, 0, 1,

      -1, -1, 0, 0,

      1, 1, 1, 1,

      1, -1, 1, 0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    const a_position = getAttribLocation(gl, program, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertice have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

    const a_texCoord = getAttribLocation(gl, program, "a_texCoord");
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);
  }

  //
  // uniforms
  //
  const u_depthTexture = getUniformLocation(gl, program, "u_depthTexture");
  const u_colorTexture = getUniformLocation(gl, program, "u_colorTexture");
  const u_normalTexture = getUniformLocation(gl, program, "u_normalTexture");
  const u_depthRange = getUniformLocation(gl, program, "u_depthRange");
  const u_textelSize = getUniformLocation(gl, program, "u_textelSize");
  const u_objectIdTexture = getUniformLocation(
    gl,
    program,
    "u_objectIdTexture",
  );

  gl.bindVertexArray(null);

  //
  // frame buffer
  //

  const DEPTH_TEXTURE_INDEX = 0;
  const COLOR_TEXTURE_INDEX = 1;
  const NORMAL_TEXTURE_INDEX = 2;
  const OBJECTID_TEXTURE_INDEX = 3;

  gl.activeTexture(gl.TEXTURE0 + DEPTH_TEXTURE_INDEX);

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

  const draw = (drawObjects: () => void) => {
    //
    // draw in the frame buffer
    //

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(vao);

    gl.activeTexture(gl.TEXTURE0 + DEPTH_TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);

    gl.activeTexture(gl.TEXTURE0 + COLOR_TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    gl.activeTexture(gl.TEXTURE0 + NORMAL_TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);

    gl.activeTexture(gl.TEXTURE0 + OBJECTID_TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);

    gl.uniform1i(u_depthTexture, DEPTH_TEXTURE_INDEX);
    gl.uniform1i(u_colorTexture, COLOR_TEXTURE_INDEX);
    gl.uniform1i(u_normalTexture, NORMAL_TEXTURE_INDEX);
    gl.uniform1i(u_objectIdTexture, OBJECTID_TEXTURE_INDEX);
    gl.uniform2fv(u_depthRange, new Float32Array([CAMERA_NEAR, CAMERA_FAR]));
    gl.uniform2fv(
      u_textelSize,
      new Float32Array([1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight]),
    );

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);

    gl.enable(gl.DEPTH_TEST);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  };

  return { draw };
};
