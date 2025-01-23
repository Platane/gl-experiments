import { mat4, vec3 } from "gl-matrix";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  linkProgram,
} from "../../../utils/gl";

import codeFrag from "./shader.frag?raw";
import codeVert from "./shader.vert?raw";

export const createBasicMeshMaterial = (c: {
  gl: WebGL2RenderingContext;
  globalTextureIndex: number;
}) => {
  const { gl } = c;

  const program = createProgram(gl, codeVert, codeFrag);
  linkProgram(gl, program);

  //
  // uniforms
  //
  const u_viewMatrix = getUniformLocation(gl, program, "u_viewMatrix");
  const u_objectMatrix = getUniformLocation(gl, program, "u_objectMatrix");
  const u_color = getUniformLocation(gl, program, "u_color");

  //
  // attributes
  //

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  //
  // position
  //

  const a_position = getAttribLocation(gl, program, "a_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

  //
  // normal
  //

  const a_normal = getAttribLocation(gl, program, "a_normal");
  gl.enableVertexAttribArray(a_normal);
  gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

  //
  gl.bindVertexArray(null);

  //
  //

  const createRenderer = ({
    geometry,
  }: {
    geometry: {
      normals: Float32Array;
      positions: Float32Array;
    };
  }) => {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

    const nVertices = geometry.positions.length / 3;

    let objectMatrix: Float32Array;
    let color: Float32Array;

    const update = (objectMatrix_: Float32Array, color_: Float32Array) => {
      objectMatrix = objectMatrix_;
      color = color_;
    };

    const _draw = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(u_objectMatrix, false, objectMatrix);
      gl.uniform3fv(u_color, color);

      gl.drawArrays(gl.TRIANGLES, 0, nVertices);
    };

    const dispose = () => {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
    };

    return { _draw, update, dispose };
  };

  const draw = (
    worldMatrix: mat4,
    renderers: ReturnType<typeof createRenderer>[],
  ) => {
    gl.useProgram(program);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);

    gl.bindVertexArray(vao);

    gl.uniformMatrix4fv(u_viewMatrix, false, worldMatrix);

    for (const r of renderers) r._draw();

    gl.bindVertexArray(null);
    gl.useProgram(null);
  };

  return { draw, createRenderer };
};
