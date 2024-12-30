import { mat4, vec3 } from "gl-matrix";
import { UP } from "./utils/vec3";
import { createGizmoMaterial } from "./renderer/materials/gizmos";
import { createInstantiatedSkinnedPosedMeshMaterial } from "./renderer/materials/instantiatedSkinnedPosedMesh";
import { loadGLTF } from "../gltf-parser";
import { computeWeights } from "./utils/bones";
import { getFlatShadingNormals } from "./utils/geometry-normals";
import triceratop_model_uri from "../model-builder/model.glb?url";
import { createCamera } from "./renderer/camera";

(async () => {
  const canvas = document.createElement("canvas");

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  document.body.appendChild(canvas);

  const gl = canvas.getContext("webgl2")!;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);

  //
  // state
  //

  const state = {
    camera: {
      eye: [0, 1, 2] as vec3,
      lookAt: [0, 0, 0] as vec3,
      generation: 1,
    },
    triceratops: [],
    gizmos: Object.assign([] as mat4[], { generation: 1 }),
  };
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  mat4.fromTranslation(state.gizmos[1], [0.4, 0, 0]);
  state.gizmos.push(mat4.create());
  mat4.fromTranslation(state.gizmos[2], [-0.4, 0, 0]);
  state.gizmos.push(mat4.create());
  mat4.fromTranslation(state.gizmos[3], [0, 0, 0.4]);

  //
  // renderer
  //

  const c = { gl, canvas, globalTextureIndex: 0 };

  const camera = Object.assign(createCamera(c), { generation: 0 });
  window.onresize = () => camera.update(state.camera.eye, state.camera.lookAt);

  const gizmoRenderer = Object.assign(createGizmoMaterial(c), {
    generation: 0,
  });

  const bindPose = [mat4.create(), mat4.create()];
  const poses = [bindPose];
  const geometry = await loadGLTF(triceratop_model_uri, "triceratops").then(
    ({ positions }) => {
      for (let i = positions.length; i--; ) positions[i] /= 40;

      return {
        positions,
        ...computeWeights(bindPose, positions),
        normals: getFlatShadingNormals(positions),
        colors: new Float32Array(
          Array.from({ length: positions.length / 3 }, () => [
            0.3, 0.1, 0.2,
          ]).flat(),
        ),
      };
    },
  );
  const triceratopsRenderer = createInstantiatedSkinnedPosedMeshMaterial(c, {
    geometry,
    boneCount: poses[0].length,
    poseCount: poses.length,
    poses: new Float32Array(
      poses.flatMap((pose) =>
        pose.flatMap((mat) => [...(mat as any as number[])]),
      ),
    ),
  });
  triceratopsRenderer.update(
    new Float32Array([0, 0]),
    new Float32Array([0, 1]),
    new Uint8Array([0, 0, 0, 0]),
    new Float32Array([1, 0, 0, 0]),
    1,
  );

  //
  // game loop
  //

  const loop = () => {
    // logic
    state.gizmos[1][12] += 0.001;
    state.gizmos.generation++;

    // update renderers
    if (state.gizmos.generation !== gizmoRenderer.generation) {
      gizmoRenderer.update(state.gizmos);
      gizmoRenderer.generation = state.gizmos.generation;
    }
    if (state.camera.generation !== camera.generation) {
      camera.update(state.camera.eye, state.camera.lookAt);
      camera.generation = state.camera.generation;
    }

    // draw
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gizmoRenderer.draw(camera.worldMatrix);
    triceratopsRenderer.draw(camera.worldMatrix);

    //
    requestAnimationFrame(loop);
  };
  loop();
})();
