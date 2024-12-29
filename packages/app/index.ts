import { mat4, vec3 } from "gl-matrix";
import { UP } from "./utils/vec3";
import { createGizmoMaterial } from "./renderer/materials/gizmos";

export const canvas = document.createElement("canvas");

canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";

document.body.appendChild(canvas);

const gl = canvas.getContext("webgl2")!;

//
// state
//

const state = {
  camera: { eye: [0, 1, 1], lookAt: [0, 0, 0], aspect: 1, generation: 1 },
  triceratops: [],
  gizmos: Object.assign([] as mat4[], { generation: 1 }),
};
state.gizmos.push(mat4.create());

//
// camera
//

const worldMatrix = mat4.create();
const updateCamera = () => {
  const perspectiveMatrix = mat4.create();
  const lookAtMatrix = mat4.create();

  const fovX = Math.PI / 3;
  const near = 0.005;
  const far = 2000;
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
  mat4.perspective(perspectiveMatrix, fovX, aspect, near, far);

  const eye: vec3 = [0, 1, 1];
  const lookAtPoint: vec3 = [0, 0, 0];
  mat4.lookAt(lookAtMatrix, eye, lookAtPoint, UP);

  mat4.multiply(worldMatrix, perspectiveMatrix, lookAtMatrix);

  // resize canvas

  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  gl.viewport(0, 0, canvas.width, canvas.height);
};
updateCamera();
window.onresize = updateCamera;

//
// renderer
//

const c = { gl, lastUsedTextureIndex: 0 };
const drawGizmo = createGizmoMaterial(c, state.gizmos);

//
// game loop
//

const loop = () => {
  drawGizmo(worldMatrix);

  //
  requestAnimationFrame(loop);
};
loop();
