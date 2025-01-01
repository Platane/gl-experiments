import { mat4, vec3 } from "gl-matrix";
import { createGizmoMaterial } from "./renderer/materials/gizmos";
import { createInstantiatedSkinnedPosedMeshMaterial } from "./renderer/materials/instantiatedSkinnedPosedMesh";
import { loadGLTF } from "../gltf-parser";
import { computeWeights } from "./utils/bones";
import { getFlatShadingNormals } from "./utils/geometry-normals";
import triceratop_model_uri from "@gl/model-builder/model.glb?url";
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
      eye: [0, 2, -4] as vec3,
      lookAt: [0, 0, 0] as vec3,
      generation: 1,
    },
    triceratops: {
      positions: new Float32Array([0, 0, 1, 1]),
      directions: new Float32Array([0, 1, 0, -1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0, 0, 1, 0, 0]),
      poseWeights: new Float32Array([0.5, 0.5, 0, 0, 1, 0, 0, 0]),
      n: 2,
      generation: 1,
    },
    gizmos: Object.assign([] as mat4[], { generation: 1 }),
  };
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  mat4.fromTranslation(state.gizmos[0], [0, 0, 0]);
  mat4.fromTranslation(state.gizmos[1], [0.4, 0, 0]);
  mat4.fromTranslation(state.gizmos[2], [-0.4, 0, 0]);
  mat4.fromTranslation(state.gizmos[3], [0, 0, 0.4]);

  {
    const n = 256 * 16;
    const l = 11;
    state.triceratops.positions = new Float32Array(
      Array.from({ length: n }, (_, i) => [
        ((i % l) - l / 2) * 0.8,
        Math.floor(i / l) * 0.9,
      ]).flat(),
    );
    state.triceratops.directions = new Float32Array(
      Array.from({ length: n }, (_, i) => {
        const a = i * 0.4;
        return [Math.sin(a), Math.cos(a)];
      }).flat(),
    );
    state.triceratops.poseIndexes = new Uint8Array(
      Array.from({ length: n }, () => [0, 1, 0, 0]).flat(),
    );
    state.triceratops.poseWeights = new Float32Array(
      Array.from({ length: n }, (_, i) => [1, 0, 0, 0]).flat(),
    );
    state.triceratops.n = n;
  }

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
  mat4.fromTranslation(bindPose[0], [0, 0, 0]);
  mat4.fromTranslation(bindPose[1], [-1, 0, 0]);

  const secondPose = [mat4.create(), mat4.create()];
  mat4.fromYRotation(secondPose[0], -Math.PI / 3);
  mat4.fromTranslation(secondPose[1], [-0.98, 0, 0]);

  const poses = [bindPose, secondPose];
  const geometry = await loadGLTF(triceratop_model_uri, "triceratops").then(
    ({ positions }) => {
      for (let i = positions.length; i--; ) positions[i] /= 20;

      return {
        positions,
        ...computeWeights(bindPose, positions),
        normals: getFlatShadingNormals(positions),
        colors: new Float32Array(
          Array.from({ length: positions.length / 3 }, () => [
            0.1, 0.6, 0.7,
          ]).flat(),
        ),
      };
    },
  );
  const triceratopsRenderer = Object.assign(
    createInstantiatedSkinnedPosedMeshMaterial(c, {
      geometry,
      boneCount: poses[0].length,
      poseCount: poses.length,
      poses: new Float32Array(
        poses.flatMap((pose) =>
          pose.flatMap((mat, j) => {
            const m = mat4.create();
            mat4.invert(m, bindPose[j]);
            mat4.multiply(m, mat, m);

            return [...(m as any as number[])];
          }),
        ),
      ),
    }),
    { generation: 0 },
  );

  //
  // game loop
  //

  const loop = () => {
    // logic
    state.gizmos[1][12] += 0.001;
    state.gizmos.generation++;

    const t = Date.now();

    for (let i = 0; i < state.triceratops.n; i += 3) {
      const k = Math.sin(t * 0.005 + i) * 0.5 + 0.5;
      state.triceratops.poseWeights[i * 4 + 1] = k;
      state.triceratops.poseWeights[i * 4 + 0] = 1 - k;
    }
    state.triceratops.generation++;

    // update renderers
    if (state.gizmos.generation !== gizmoRenderer.generation) {
      gizmoRenderer.update(state.gizmos);
      gizmoRenderer.generation = state.gizmos.generation;
    }
    if (state.camera.generation !== camera.generation) {
      camera.update(state.camera.eye, state.camera.lookAt);
      camera.generation = state.camera.generation;
    }
    if (state.triceratops.generation !== triceratopsRenderer.generation) {
      triceratopsRenderer.update(
        state.triceratops.positions,
        state.triceratops.directions,
        state.triceratops.poseIndexes,
        state.triceratops.poseWeights,
        state.triceratops.n,
      );
      triceratopsRenderer.generation = state.triceratops.generation;
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
