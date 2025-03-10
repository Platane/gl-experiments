import { mat4, vec3 } from "gl-matrix";
import codeFrag from "./shader.frag?raw";
import codeVert from "./shader.vert?raw";
import {
  createProgram,
  getAttribLocation,
  linkProgram,
} from "../../../utils/gl";

/**
 * display a list of gizmos (= oriented pyramid )
 * for debugging purpose
 */
export const createGridMaterial = (
  { gl }: { gl: WebGL2RenderingContext },
  {
    gridSize = 10.05,
    unitSize = 1,
    lineWidth = 0.005,
    lineColor = [0, 0, 0],
    context = "floor",
  }: {
    gridSize?: number;
    unitSize?: number;
    lineColor?: [number, number, number];
    lineWidth?: number;
    context?: "floor" | "room";
  } = {},
) => {
  const program = createProgram(gl, codeVert, codeFrag);
  linkProgram(gl, program);

  //
  // uniforms
  //
  const u_viewMatrix = gl.getUniformLocation(program, "u_viewMatrix");
  const u_lineWidth = gl.getUniformLocation(program, "u_lineWidth");
  const u_lineColor = gl.getUniformLocation(program, "u_lineColor");

  //
  // attributes
  //
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const s = gridSize / 2;
  const u = (s * 1) / unitSize;

  // interleaved position and texCoord
  // biome-ignore format: better
  const quadData = new Float32Array([
    -s,  0,  s,      -u,  u,      0,  1,  0,
     s,  0,  s,       u,  u,      0,  1,  0,
    -s,  0, -s,      -u, -u,      0,  1,  0,
     s,  0, -s,       u, -u,      0,  1,  0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

  const a_position = getAttribLocation(gl, program, "a_position");
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 32, 0);

  const a_texCoord = getAttribLocation(gl, program, "a_texCoord");
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 32, 12);

  const a_normal = getAttribLocation(gl, program, "a_normal");
  gl.enableVertexAttribArray(a_normal);
  gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 32, 20);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const draw = (viewMatrix: mat4) => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix);
    gl.uniform1f(u_lineWidth, lineWidth / 2 / unitSize);
    gl.uniform3f(u_lineColor, ...lineColor);

    gl.disable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.DEPTH_TEST);

    gl.bindVertexArray(null);
    gl.useProgram(null);
  };

  const dispose = () => {
    gl.deleteProgram(program);
  };

  return { draw, dispose };
};
