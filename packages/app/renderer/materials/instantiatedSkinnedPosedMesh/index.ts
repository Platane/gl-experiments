import { mat4 } from "gl-matrix";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  linkProgram,
} from "../../../utils/gl";

import codeFrag from "./shader.frag?raw";
import codeVert from "./shader.vert?raw";

/**
 * render an instantiated geometry,
 * each instance have it's own position / direction / mix of poses
 */
export const createInstantiatedSkinnedPosedMeshMaterial = (
  {
    gl,
  }: {
    gl: WebGL2RenderingContext;
  },
  {
    bonePerVertex = 4,
    posePerVertex = 2,
  }: { bonePerVertex?: 2 | 4; posePerVertex?: 2 | 4 } = {},
) => {
  const program = createProgram(
    gl,
    codeVert
      .replace("in vec4 a_boneWeights", `in vec${bonePerVertex} a_boneWeights`)
      .replace(
        "in uvec4 a_boneIndexes",
        `in uvec${bonePerVertex} a_boneIndexes`,
      )
      .replace(
        "in vec4 a_instancePoseWeights",
        `in vec${posePerVertex} a_instancePoseWeights`,
      )
      .replace(
        "in uvec4 a_instancePoseIndexes",
        `in uvec${posePerVertex} a_instancePoseIndexes`,
      ),
    codeFrag,
  );
  linkProgram(gl, program);

  //
  // uniforms
  //
  const u_viewMatrix = gl.getUniformLocation(program, "u_viewMatrix");
  const u_posesTexture = getUniformLocation(gl, program, "u_posesTexture");
  const u_colorPalettesTexture = getUniformLocation(
    gl,
    program,
    "u_colorPalettesTexture",
  );

  //
  // attributes
  //
  const a_position = getAttribLocation(gl, program, "a_position");
  const a_normal = getAttribLocation(gl, program, "a_normal");
  const a_colorIndex = getAttribLocation(gl, program, "a_colorIndex");
  const a_boneWeights = getAttribLocation(gl, program, "a_boneWeights");
  const a_boneIndexes = getAttribLocation(gl, program, "a_boneIndexes");
  const a_instancePosition = getAttribLocation(
    gl,
    program,
    "a_instancePosition",
  );
  const a_instanceDirection = getAttribLocation(
    gl,
    program,
    "a_instanceDirection",
  );
  const a_instanceColorPaletteIndex = getAttribLocation(
    gl,
    program,
    "a_instanceColorPaletteIndex",
  );
  const a_instancePoseIndexes = getAttribLocation(
    gl,
    program,
    "a_instancePoseIndexes",
  );
  const a_instancePoseWeights = getAttribLocation(
    gl,
    program,
    "a_instancePoseWeights",
  );

  const createRenderer = ({
    geometry,
    colorPalettes,
    poses,
  }: {
    geometry: {
      normals: Float32Array;
      positions: Float32Array;

      boneWeights: Float32Array;
      boneIndexes: Uint8Array;
      boneCount: number;

      colorIndexes: Uint8Array;
      colorCount: number;
    };

    colorPalettes: Uint8Array; // as ( r, g, b )[][] ( = palette[] )
    poses: Float32Array; // as mat4[][] as ( pose[] )
  }) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posesTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, posesTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // level
      gl.RGBA16F, // internal format
      4 * geometry.boneCount, // 4 pixels, each pixel has RGBA so 4 pixels is 16 values ( = one matrix ). one row contains all bones
      poses.length / (16 * geometry.boneCount), // one row per pose
      0, // border
      gl.RGBA, // format
      gl.FLOAT, // type
      poses,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const colorPalettesTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorPalettesTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB8,
      geometry.colorCount,
      colorPalettes.length / (geometry.colorCount * 3),
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      colorPalettes,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_normal);
    gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

    const colorIndexesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorIndexesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.colorIndexes, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_colorIndex);
    gl.vertexAttribIPointer(a_colorIndex, 1, gl.UNSIGNED_BYTE, 0, 0);

    const boneWeightsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boneWeightsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.boneWeights, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_boneWeights);
    gl.vertexAttribPointer(a_boneWeights, bonePerVertex, gl.FLOAT, false, 0, 0);

    const boneIndexesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boneIndexesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.boneIndexes, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_boneIndexes);
    gl.vertexAttribIPointer(
      a_boneIndexes,
      bonePerVertex,
      gl.UNSIGNED_BYTE,
      0,
      0,
    );

    //

    const instancePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer);
    gl.enableVertexAttribArray(a_instancePosition);
    gl.vertexAttribPointer(a_instancePosition, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_instancePosition, 1);

    const instanceDirectionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceDirectionBuffer);
    gl.enableVertexAttribArray(a_instanceDirection);
    gl.vertexAttribPointer(a_instanceDirection, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_instanceDirection, 1);

    const instanceColorPaletteIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorPaletteIndexBuffer);
    gl.enableVertexAttribArray(a_instanceColorPaletteIndex);
    gl.vertexAttribIPointer(
      a_instanceColorPaletteIndex,
      1,
      gl.UNSIGNED_BYTE,
      0,
      0,
    );
    gl.vertexAttribDivisor(a_instanceColorPaletteIndex, 1);

    const instancePoseIndexesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseIndexesBuffer);
    gl.enableVertexAttribArray(a_instancePoseIndexes);
    gl.vertexAttribIPointer(
      a_instancePoseIndexes,
      posePerVertex,
      gl.UNSIGNED_BYTE,
      0,
      0,
    );
    gl.vertexAttribDivisor(a_instancePoseIndexes, 1);

    const instancePoseWeightsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseWeightsBuffer);
    gl.enableVertexAttribArray(a_instancePoseWeights);
    gl.vertexAttribPointer(
      a_instancePoseWeights,
      posePerVertex,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.vertexAttribDivisor(a_instancePoseWeights, 1);

    gl.bindVertexArray(null);

    let nInstances = 0;
    const nVertices = geometry.positions.length / 3;

    const render = () => {
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, posesTexture);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, colorPalettesTexture);

      gl.drawArraysInstanced(gl.TRIANGLES, 0, nVertices, nInstances);

      gl.bindVertexArray(null);
    };

    /**
     * update the instances
     */
    const update = (
      {
        positions,
        directions,
        poseIndexes,
        poseWeights,
        colorPaletteIndexes,
      }: {
        positions: Float32Array; // as ( x, y )
        directions: Float32Array; // as ( x, y )
        poseIndexes: Uint8Array; // as ( pose1, pose2 )
        poseWeights: Float32Array; // as ( weight1, weight2 )
        colorPaletteIndexes: Uint8Array; // as ( colorPaletteIndex )
      },
      n: number,
      offset: number = 0,
    ) => {
      nInstances = n;

      gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        positions,
        gl.DYNAMIC_DRAW,
        offset * 2,
        n * 2,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, instanceDirectionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        directions,
        gl.DYNAMIC_DRAW,
        offset * 2,
        n * 2,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseIndexesBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        poseIndexes,
        gl.DYNAMIC_DRAW,
        offset * 2,
        n * 2,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, instancePoseWeightsBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        poseWeights,
        gl.DYNAMIC_DRAW,
        offset * 2,
        n * 2,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, instanceColorPaletteIndexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        colorPaletteIndexes,
        gl.DYNAMIC_DRAW,
        offset * 1,
        n * 1,
      );
    };

    const dispose = () => {
      gl.deleteVertexArray(vao);

      gl.deleteTexture(posesTexture);
      gl.deleteTexture(colorPalettesTexture);

      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      gl.deleteBuffer(colorIndexesBuffer);
      gl.deleteBuffer(boneWeightsBuffer);
      gl.deleteBuffer(boneIndexesBuffer);

      gl.deleteBuffer(instancePositionBuffer);
      gl.deleteBuffer(instanceDirectionBuffer);
      gl.deleteBuffer(instancePoseIndexesBuffer);
      gl.deleteBuffer(instancePoseWeightsBuffer);
      gl.deleteBuffer(instanceColorPaletteIndexBuffer);
    };

    return { render, update, dispose };
  };

  const draw = (viewMatrix: mat4, callRenderers: () => void) => {
    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix);

    gl.uniform1i(u_posesTexture, 0);
    gl.uniform1i(u_colorPalettesTexture, 1);

    callRenderers();

    gl.useProgram(null);
  };

  const dispose = () => {
    gl.deleteProgram(program);
  };

  return { draw, createRenderer, dispose };
};
