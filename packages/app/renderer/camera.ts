import { mat4, vec3 } from "gl-matrix";
import { UP } from "../utils/vec3";

export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 8000;

export const createLookAtCamera = ({
  canvas,
}: { canvas: HTMLCanvasElement }) => {
  const worldMatrix = mat4.create();
  const perspectiveMatrix = mat4.create();
  const lookAtMatrix = mat4.create();

  const fovX = Math.PI / 3;
  const near = CAMERA_NEAR;
  const far = CAMERA_FAR;

  const update = (eye: vec3, lookAtPoint: vec3) => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    mat4.perspective(perspectiveMatrix, fovX, aspect, near, far);

    mat4.lookAt(lookAtMatrix, eye, lookAtPoint, UP);

    mat4.multiply(worldMatrix, perspectiveMatrix, lookAtMatrix);
  };

  return { update, worldMatrix };
};

export const resizeViewport = ({
  gl,
  canvas,
}: { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext }) => {
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  gl.viewport(0, 0, canvas.width, canvas.height);
};
