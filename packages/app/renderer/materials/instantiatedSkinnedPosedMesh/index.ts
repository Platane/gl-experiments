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

import codePostFrag from "./shader-post.frag?raw";
import codeQuadVert from "./shader-quad.vert?raw";

/**
 * render an instantiated geometry,
 * each instance have it's own position / direction / mix of poses
 */
export const createInstantiatedSkinnedPosedMeshMaterial = (
  c: {
    gl: WebGL2RenderingContext;
    globalTextureIndex: number;
  },
  {
    geometry,
    poses,
    colorPalettes,
  }: {
    geometry: {
      normals: Float32Array;
      positions: Float32Array;
      colorIndexes: Uint8Array;
      boneWeights: Float32Array;
      boneIndexes: Uint8Array;
    };

    colorPalettes: [number, number, number][][];
    poses: mat4[][];
  },
) => {
  const { gl } = c;

  const program = createProgram(gl, codeVert, codeFrag);
  linkProgram(gl, program);

  //
  // uniforms
  //
  const u_viewMatrix = gl.getUniformLocation(program, "u_viewMatrix");

  //
  // poses
  //
  const POSES_TEXTURE_INDEX = c.globalTextureIndex++;
  const posesTexture = gl.createTexture();
  const u_posesTexture = getUniformLocation(gl, program, "u_posesTexture");
  gl.activeTexture(gl.TEXTURE0 + POSES_TEXTURE_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, posesTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.RGBA32F, // internal format
    4 * poses[0].length, // 4 pixels, each pixel has RGBA so 4 pixels is 16 values ( = one matrix ). one row contains all bones
    poses.length, // one row per pose
    0, // border
    gl.RGBA, // format
    gl.FLOAT, // type
    new Float32Array(
      poses.flatMap((pose) =>
        pose.flatMap((mat, j) => {
          const bindPose = poses[0];
          const m = mat4.create();
          mat4.invert(m, bindPose[j]);
          mat4.multiply(m, mat, m);

          return [...(m as any as number[])];
        }),
      ),
    ),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  //
  // color palettes
  //
  const COLOR_PALETTES_TEXTURE_INDEX = c.globalTextureIndex++;
  const colorPalettesTexture = gl.createTexture();
  const u_colorPalettesTexture = getUniformLocation(
    gl,
    program,
    "u_colorPalettesTexture",
  );
  gl.activeTexture(gl.TEXTURE0 + COLOR_PALETTES_TEXTURE_INDEX);
  gl.bindTexture(gl.TEXTURE_2D, colorPalettesTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.RGB32F, // internal format

    colorPalettes[0].length, // one row contains a palette
    colorPalettes.length,
    0, // border
    gl.RGB, // format
    gl.FLOAT, // type
    new Float32Array(colorPalettes.flat(2)),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  //
  // attributes
  //

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  //
  // position
  //
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
  const a_position = getAttribLocation(gl, program, "a_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  //
  // normal
  //
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
  const a_normal = getAttribLocation(gl, program, "a_normal");
  gl.enableVertexAttribArray(a_normal);
  gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

  //
  // color
  //
  const colorIndexesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorIndexesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.colorIndexes, gl.STATIC_DRAW);
  const a_colorIndex = getAttribLocation(gl, program, "a_colorIndex");
  gl.enableVertexAttribArray(a_colorIndex);
  gl.vertexAttribIPointer(a_colorIndex, 1, gl.UNSIGNED_BYTE, 0, 0);

  //
  // bone weight
  //
  const weightsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, weightsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.boneWeights, gl.STATIC_DRAW);
  const a_weights = getAttribLocation(gl, program, "a_weights");
  gl.enableVertexAttribArray(a_weights);
  gl.vertexAttribPointer(a_weights, 4, gl.FLOAT, false, 0, 0);

  //
  // bone indexes
  //
  const boneIndexesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boneIndexesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.boneIndexes, gl.STATIC_DRAW);
  const a_boneIndexes = getAttribLocation(gl, program, "a_boneIndexes");
  gl.enableVertexAttribArray(a_boneIndexes);
  gl.vertexAttribIPointer(a_boneIndexes, 4, gl.UNSIGNED_BYTE, 0, 0);

  //
  // instance position
  //
  const instancePositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer);
  const a_instancePosition = getAttribLocation(
    gl,
    program,
    "a_instancePosition",
  );
  gl.enableVertexAttribArray(a_instancePosition);
  gl.vertexAttribPointer(a_instancePosition, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_instancePosition, 1);

  //
  // instance direction
  //
  const instanceDirectionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceDirectionBuffer);
  const a_instanceDirection = getAttribLocation(
    gl,
    program,
    "a_instanceDirection",
  );
  gl.enableVertexAttribArray(a_instanceDirection);
  gl.vertexAttribPointer(a_instanceDirection, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_instanceDirection, 1);

  //
  // instance color palette index
  //
  const instanceColorPaletteIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorPaletteIndexBuffer);
  const a_instanceColorPaletteIndex = getAttribLocation(
    gl,
    program,
    "a_instanceColorPaletteIndex",
  );
  gl.enableVertexAttribArray(a_instanceColorPaletteIndex);
  gl.vertexAttribIPointer(
    a_instanceColorPaletteIndex,
    1,
    gl.UNSIGNED_BYTE,
    0,
    0,
  );
  gl.vertexAttribDivisor(a_instanceColorPaletteIndex, 1);

  //
  // instance pose indexes
  //
  const instancePoseIndexesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseIndexesBuffer);
  const a_instancePoseIndexes = getAttribLocation(
    gl,
    program,
    "a_instancePoseIndexes",
  );
  gl.enableVertexAttribArray(a_instancePoseIndexes);
  gl.vertexAttribIPointer(a_instancePoseIndexes, 4, gl.UNSIGNED_BYTE, 0, 0);
  gl.vertexAttribDivisor(a_instancePoseIndexes, 1);

  //
  // instance pose weights
  //
  const instancePoseWeightsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseWeightsBuffer);
  const a_instancePoseWeights = getAttribLocation(
    gl,
    program,
    "a_instancePoseWeights",
  );
  gl.enableVertexAttribArray(a_instancePoseWeights);
  gl.vertexAttribPointer(a_instancePoseWeights, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(a_instancePoseWeights, 1);

  //
  gl.bindVertexArray(null);

  //
  //

  const nVertices = geometry.positions.length / 3;

  let nInstances = 0;

  //
  // post effect screen space program
  //

  const postEffectProgram = createProgram(gl, codeQuadVert, codePostFrag);
  const postEffectVAO = gl.createVertexArray();

  gl.bindVertexArray(postEffectVAO);
  linkProgram(gl, postEffectProgram);
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

    const a_position = getAttribLocation(gl, postEffectProgram, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0); // read interleaved data, each vertice have 16 bytes ( (2+2) * 4 bytes for float32 ), position offset is 0

    const a_texCoord = getAttribLocation(gl, postEffectProgram, "a_texCoord");
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);
  }
  const u_depthTexture = getUniformLocation(
    gl,
    postEffectProgram,
    "u_depthTexture",
  );
  const u_colorTexture = getUniformLocation(
    gl,
    postEffectProgram,
    "u_colorTexture",
  );
  const u_normalTexture = getUniformLocation(
    gl,
    postEffectProgram,
    "u_normalTexture",
  );
  const u_objectIdTexture = getUniformLocation(
    gl,
    postEffectProgram,
    "u_objectIdTexture",
  );
  const u_depthRange = getUniformLocation(
    gl,
    postEffectProgram,
    "u_depthRange",
  );
  const u_textelSize = getUniformLocation(
    gl,
    postEffectProgram,
    "u_textelSize",
  );
  gl.bindVertexArray(null);

  //
  // frame buffer
  //

  const POSTEFFECT_DEPTH_TEXTURE_INDEX = c.globalTextureIndex++;
  const POSTEFFECT_COLOR_TEXTURE_INDEX = c.globalTextureIndex++;
  const POSTEFFECT_NORMAL_TEXTURE_INDEX = c.globalTextureIndex++;
  const POSTEFFECT_OBJECTID_TEXTURE_INDEX = c.globalTextureIndex++;

  gl.activeTexture(gl.TEXTURE0 + POSTEFFECT_DEPTH_TEXTURE_INDEX);

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

  console.log(
    "depth bits",
    gl.getParameter(gl.DEPTH_BITS),
    gl.getParameter(gl.STENCIL_BITS),
  );

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

  /**
   * update the instances
   */
  const update = (
    positions: Float32Array,
    directions: Float32Array,
    poseIndexes: Uint8Array,
    poseWeights: Float32Array,
    colorPaletteIndexes: Uint8Array,
    n: number,
  ) => {
    nInstances = n;

    gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceDirectionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, directions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseIndexesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, poseIndexes, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseWeightsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, poseWeights, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorPaletteIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorPaletteIndexes, gl.DYNAMIC_DRAW);
  };

  let k = 0;

  const draw = (worldMatrix: mat4) => {
    gl.useProgram(program);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));

    gl.uniformMatrix4fv(u_viewMatrix, false, worldMatrix);

    gl.bindVertexArray(vao);

    gl.uniform1i(u_posesTexture, POSES_TEXTURE_INDEX);
    gl.uniform1i(u_colorPalettesTexture, COLOR_PALETTES_TEXTURE_INDEX);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, nVertices, nInstances);

    // if (k++ % 200 === 0) {
    //   const data = new Uint8Array(
    //     4 * gl.drawingBufferWidth * gl.drawingBufferHeight,
    //   );
    //   gl.readBuffer(gl.COLOR_ATTACHMENT2); // This is the attachment we want to read
    //   gl.readPixels(
    //     0,
    //     0,
    //     gl.drawingBufferWidth,
    //     gl.drawingBufferHeight,
    //     gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
    //     gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
    //     data,
    //   );
    //   const a = new Map<string | number, number>();
    //   for (let i = 0; i < data.length; i += 4) {
    //     const key = data[i + 0];
    //     if (key === 0) continue;
    //     // const key= data.slice(i, i + 4).join(" ");
    //     a.set(key, 1 + (a.get(key) ?? 0));
    //   }
    //   const total = [...a.values()].reduce((sum, x) => sum + x, 0);
    //   console.log(
    //     [...a.entries()].map(
    //       ([key, count]) =>
    //         `${key} (${Math.round((count / total) * 1000) / 10})`,
    //     ),
    //   );
    // }

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

    gl.bindVertexArray(null);
    gl.useProgram(null);

    {
      gl.useProgram(postEffectProgram);
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(postEffectVAO);

      gl.activeTexture(gl.TEXTURE0 + POSTEFFECT_DEPTH_TEXTURE_INDEX);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);

      gl.activeTexture(gl.TEXTURE0 + POSTEFFECT_COLOR_TEXTURE_INDEX);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);

      gl.activeTexture(gl.TEXTURE0 + POSTEFFECT_NORMAL_TEXTURE_INDEX);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);

      gl.activeTexture(gl.TEXTURE0 + POSTEFFECT_OBJECTID_TEXTURE_INDEX);
      gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);

      gl.uniform1i(u_depthTexture, POSTEFFECT_DEPTH_TEXTURE_INDEX);
      gl.uniform1i(u_colorTexture, POSTEFFECT_COLOR_TEXTURE_INDEX);
      gl.uniform1i(u_normalTexture, POSTEFFECT_NORMAL_TEXTURE_INDEX);
      gl.uniform1i(u_objectIdTexture, POSTEFFECT_OBJECTID_TEXTURE_INDEX);
      gl.uniform2fv(u_depthRange, new Float32Array([CAMERA_NEAR, CAMERA_FAR]));
      gl.uniform2fv(
        u_textelSize,
        new Float32Array([
          1 / gl.drawingBufferWidth,
          1 / gl.drawingBufferHeight,
        ]),
      );

      gl.enable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.BLEND);

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindVertexArray(null);
      gl.useProgram(null);
    }
  };

  return { draw, update };
};
