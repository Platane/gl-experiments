import { mat4, quat, vec3 } from "gl-matrix";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBasicMeshMaterial } from "../../app/renderer/materials/basicMesh";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const gl = canvas.getContext("webgl2")!;

const sphereGeometry = createRecursiveSphere();
const sphereMaterial = createBasicMeshMaterial({ gl });
const sphereRenderer = sphereMaterial.createRenderer({
  geometry: {
    positions: new Float32Array(sphereGeometry),
    normals: getFlatShadingNormals(sphereGeometry),
  },
});
const sphereColor = new Float32Array([0.4, 0.4, 0.7]);
const sphereTransform = mat4.create() as Float32Array;

//
// camera
//

const worldMatrix = mat4.create();
const perspectiveMatrix = mat4.create();
const lookAtMatrix = mat4.create();

const fovX = Math.PI / 3;
const near = 0.01;
const far = 100;
const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
const eye = [0, 0, 3] as vec3;
const lookAtPoint = [0, 0, 0] as vec3;

const aspect = canvas.clientWidth / canvas.clientHeight;
mat4.perspective(perspectiveMatrix, fovX, aspect, near, far);
mat4.lookAt(lookAtMatrix, eye, lookAtPoint, [0, 1, 0]);
mat4.multiply(worldMatrix, perspectiveMatrix, lookAtMatrix);

canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

gl.viewport(0, 0, canvas.width, canvas.height);

//
// loop
//

const loop = () => {
  //
  // move sphere
  //
  const s = 1;
  const q = quat.create();
  mat4.fromRotationTranslationScale(sphereTransform, q, [0, 0, 0], [s, s, s]);
  sphereRenderer.update(sphereTransform, sphereColor);

  //
  // draw
  //
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  sphereMaterial.draw(worldMatrix, sphereRenderer.render);

  //
  // loop
  //
  requestAnimationFrame(loop);
};

loop();
