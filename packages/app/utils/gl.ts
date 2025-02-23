/**
 * create a program from vertex and fragment shader sources
 */
export const createProgram = (
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram => {
  const vertShader = initShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragShader = initShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

  const shaderProgram = gl.createProgram() as WebGLProgram;
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);

  return shaderProgram;
};

export const linkProgram = (
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
) => {
  gl.linkProgram(shaderProgram);

  if (
    process.env.NODE_ENV !== "production" &&
    !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)
  )
    throw "Unable to initialize the shader program.";
};

const initShader = (
  gl: WebGLRenderingContext,
  sourceCode: string,
  shaderType: number,
): WebGLShader => {
  const shader = gl.createShader(shaderType)!;

  gl.shaderSource(shader, sourceCode);

  gl.compileShader(shader);

  // See if it compiled successfully
  if (
    process.env.NODE_ENV !== "production" &&
    !gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  )
    throw (
      "An error occurred compiling the shaders: \n" +
      (gl.getShaderInfoLog(shader) || "") +
      "\n" +
      sourceCode
    );

  return shader;
};

export const getAttribLocation = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) => {
  const position = gl.getAttribLocation(program, name);

  if (process.env.NODE_ENV !== "production" && position === -1)
    // throw `Unable to localize ${name}.`;
    console.warn(`Unable to localize ${name}.`);

  return position;
};

export const getAttribLocations = <T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: T[],
) =>
  Object.fromEntries(
    names.map((name) => [name, getAttribLocation(gl, program, name)]),
  ) as Record<T, ReturnType<typeof getAttribLocation>>;

export const getUniformLocation = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) => {
  const position = gl.getUniformLocation(program, name);

  if (process.env.NODE_ENV !== "production" && position === null)
    // throw `Unable to localize ${name}.`;
    console.warn(`Unable to localize ${name}.`);

  return position;
};

export const getUniformLocations = <T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: T[],
) =>
  Object.fromEntries(
    names.map((name) => [name, getUniformLocation(gl, program, name)]),
  ) as Record<T, ReturnType<typeof getUniformLocation>>;
