import { mat4 } from "gl-matrix";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
} from "../../../utils/gl";
import codeFrag from "./shader.frag?raw";
import codeVert from "./shader.vert?raw";

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
    poseCount,
    boneCount,
  }: {
    geometry: {
      normals: Float32Array;
      positions: Float32Array;
      colors: Float32Array;
      boneWeights: Float32Array;
      boneIndexes: Uint8Array;
    };
    poses: Float32Array;
    poseCount: number;
    boneCount: number;
  },
) => {
  const { gl } = c;

  const program = createProgram(gl, codeVert, codeFrag);

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
    4 * boneCount, // 4 pixels, each pixel has RGBA so 4 pixels is 16 values ( = one matrix ). one row contains all bones
    poseCount, // one row per pose
    0, // border
    gl.RGBA, // format
    gl.FLOAT, // type
    poses,
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
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.STATIC_DRAW);
  const a_color = getAttribLocation(gl, program, "a_color");
  gl.enableVertexAttribArray(a_color);
  gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);

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

  /**
   * update the instances
   */
  const update = (
    positions: Float32Array,
    directions: Float32Array,
    poseIndexes: Uint8Array,
    poseWeights: Float32Array,
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
  };

  const draw = (worldMatrix: mat4) => {
    gl.useProgram(program);

    gl.uniformMatrix4fv(u_viewMatrix, false, worldMatrix);

    gl.bindVertexArray(vao);

    gl.bindTexture(gl.TEXTURE_2D, posesTexture);
    gl.uniform1i(u_posesTexture, POSES_TEXTURE_INDEX);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, nVertices, nInstances);

    gl.bindVertexArray(null);
  };

  return { draw, update };
};
