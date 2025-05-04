import { mat4, vec3 } from "gl-matrix";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import {
  createProgram,
  getAttribLocation,
  getUniformLocation,
  linkProgram,
} from "../../app/utils/gl";

import { createOrbitControl } from "../../app/control/orbitCamera";
import { createLookAtCamera } from "../../app/renderer/camera";
import codeFrag from "./shader.frag?raw";
import codeVert_ from "./shader.vert?raw";

let codeVert = codeVert_;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const gl = canvas.getContext("webgl2")!;

const clipCullDistanceExtension = gl.getExtension("WEBGL_clip_cull_distance");
if (!clipCullDistanceExtension) {
  codeVert = codeVert
    .replace("#define clip_cull_distance_extension", "")
    .replace("#extension GL_ANGLE_clip_cull_distance : enable", "");
}

const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

const sphereGeometry = createRecursiveSphere({ tesselatationStep: 4 });

const spheres = Array.from({ length: 4 }, (_, i) => {
  const transform = mat4.create() as Float32Array;
  mat4.identity(transform);
  const s = 0.3 + i / 4;
  mat4.fromScaling(transform, [s, s, s]);

  const color = new Float32Array([i / 4, 0.4, 0.7]);

  return { transform, color };
});

const program = createProgram(gl, codeVert, codeFrag);
linkProgram(gl, program);

const u_clippingPlane = getUniformLocation(gl, program, "u_clippingPlane");
const u_objectMatrix = getUniformLocation(gl, program, "u_objectMatrix");
const u_viewMatrix = getUniformLocation(gl, program, "u_viewMatrix");
const u_color = getUniformLocation(gl, program, "u_color");

const a_position = getAttribLocation(gl, program, "a_position");
const a_normal = getAttribLocation(gl, program, "a_normal");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(sphereGeometry),
  gl.STATIC_DRAW,
);
gl.enableVertexAttribArray(a_position);
gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  getFlatShadingNormals(sphereGeometry),
  gl.STATIC_DRAW,
);
gl.enableVertexAttribArray(a_normal);
gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

const clippingPlane = new Float32Array([1, 0.2, -0.3, 0.8]) satisfies vec3;
vec3.normalize(clippingPlane, clippingPlane);

//
//

gl.viewport(0, 0, canvas.width, canvas.height);

gl.disable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

if (clipCullDistanceExtension)
  gl.enable(clipCullDistanceExtension.CLIP_DISTANCE0_WEBGL);

const draw = () => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniformMatrix4fv(u_viewMatrix, false, camera.worldMatrix);
  gl.uniform4fv(u_clippingPlane, clippingPlane);

  for (const { color, transform } of spheres) {
    gl.uniform3fv(u_color, color);
    gl.uniformMatrix4fv(u_objectMatrix, false, transform);

    gl.drawArrays(gl.TRIANGLES, 0, sphereGeometry.length / 3);
  }
};

const camera = Object.assign(createLookAtCamera({ canvas }), {
  eye: [0, 0, 3] as vec3,
  lookAt: [0, 0, 0] as vec3,
});
camera.update(camera.eye, camera.lookAt);
createOrbitControl({ canvas }, camera, () => {
  camera.update(camera.eye, camera.lookAt);
  draw();
});

document.getElementById("input_range")!.addEventListener("input", (event) => {
  clippingPlane[3] = +(event.target as any).value;
  draw();
});
document.getElementById("input_range")!.dispatchEvent(new Event("input"));
