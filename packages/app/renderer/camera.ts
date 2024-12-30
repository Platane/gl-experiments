import { mat4, vec3 } from "gl-matrix";
import { UP } from "../utils/vec3";

export const createCamera = ({
  gl,
  canvas,
}: {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
}) => {
  const worldMatrix = mat4.create();
  const perspectiveMatrix = mat4.create();
  const lookAtMatrix = mat4.create();

  const fovX = Math.PI / 3;
  const near = 0.005;
  const far = 2000;
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

  const update = (eye: vec3, lookAtPoint: vec3) => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    mat4.perspective(perspectiveMatrix, fovX, aspect, near, far);

    mat4.lookAt(lookAtMatrix, eye, lookAtPoint, UP);

    mat4.multiply(worldMatrix, perspectiveMatrix, lookAtMatrix);

    // resize canvas

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  return { update, worldMatrix };
};
