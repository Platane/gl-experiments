import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  getUniformLocations,
  linkProgram,
} from "../gl";
import codeQuadVert from "./shader-quad.vert?raw";

export const createScreenSpaceProgram = (
  gl: WebGL2RenderingContext,
  codeFrag: string,
) => {
  const program = createProgram(gl, codeQuadVert, codeFrag);
  linkProgram(gl, program);

  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

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

  const a_viewportSize = getAttribLocation(gl, program, "a_viewportSize");
  gl.vertexAttribI4ui(
    a_viewportSize,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    0,
  );

  gl.bindVertexArray(null);

  const draw = () => {
    gl.bindVertexArray(vao);

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);

    gl.bindVertexArray(null);
  };

  const dispose = () => {
    gl.deleteBuffer(quadBuffer);
    gl.deleteProgram(program);
  };

  return { program, draw, dispose };
};

export const createScreenSpaceProgramWithUniforms = <T extends string>(
  gl: WebGL2RenderingContext,
  codeFrag: string,
  uniformNames: T[],
) => {
  const ssp = createScreenSpaceProgram(gl, codeFrag);

  return Object.assign(ssp, {
    uniform: getUniformLocations(gl, ssp.program, uniformNames),
  });
};
