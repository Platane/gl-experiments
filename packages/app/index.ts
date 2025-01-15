import { mat4, quat, vec3 } from "gl-matrix";
import { createGizmoMaterial } from "./renderer/materials/gizmos";
import { createInstantiatedSkinnedPosedMeshMaterial } from "./renderer/materials/instantiatedSkinnedPosedMesh";
import { createCamera } from "./renderer/camera";
import { clamp, invLerp } from "./utils/math";
import {
  colorPalettes as triceratopsColorPalettes,
  getGeometry as getTriceratopsGeometry,
  poses as triceratopsPoses,
} from "./renderer/geometries/triceratops";
import { createOrbitControl } from "./control/orbitCamera";
import { createBasicMeshMaterial } from "./renderer/materials/basicMesh";
import { createRecursiveSphere } from "./renderer/geometries/recursiveSphere";
import { getGeometry as getFoxGeometry } from "./renderer/geometries/fox";
// @ts-ignore
import hash from "hash-int";
import { getFlatShadingNormals } from "./utils/geometry-normals";

(async () => {
  const canvas = document.createElement("canvas");

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  document.body.appendChild(canvas);

  const gl = canvas.getContext("webgl2", {
    antialiasing: false,
  }) as WebGL2RenderingContext;
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
    sphere: {
      position: [0, 0, 0] as vec3,
      generation: 1,
    },
    triceratops: {
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0]),
      poseWeights: new Float32Array([0.5, 0.5, 0, 0]),
      paletteIndexes: new Uint8Array([0]),
      n: 1,
      generation: 1,
    },
    fox: {
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0]),
      poseWeights: new Float32Array([1, 0, 0, 0]),
      paletteIndexes: new Uint8Array([1]),
      n: 1,
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
    const n = 1 << 10;
    const l = Math.floor(Math.sqrt(n));
    state.triceratops.positions = new Float32Array(
      Array.from({ length: n }, (_, i) => [
        (i % l) - l / 2,
        Math.floor(i / l),
      ]).flat(),
    );
    state.triceratops.directions = new Float32Array(
      Array.from({ length: n }, (_, i) => {
        const a = hash(i + 3);
        return [Math.sin(a), Math.cos(a)];
      }).flat(),
    );
    state.triceratops.poseIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => [0, hash(i * 2) % 3, 0, 0]).flat(),
    );
    state.triceratops.paletteIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => hash(i) % 6),
    );
    state.triceratops.poseWeights = new Float32Array(
      Array.from({ length: n }, (_, i) => [1, 0, 0, 0]).flat(),
    );
    state.triceratops.n = n;
  }

  {
    const n = 1 << 10;
    const l = Math.floor(Math.sqrt(n));
    state.fox.positions = new Float32Array(
      Array.from({ length: n }, (_, i) => [
        ((i % l) - l / 2) * 120,
        Math.floor(i / l) * 120,
      ]).flat(),
    );
    state.fox.directions = new Float32Array(
      Array.from({ length: n }, (_, i) => {
        const a = hash(i + 3);
        return [Math.sin(a), Math.cos(a)];
      }).flat(),
    );
    state.fox.poseIndexes = new Uint8Array(
      Array.from({ length: n }, () => [0, 0, 0, 0]).flat(),
    );
    state.fox.paletteIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => hash(i + 17) % 6),
    );
    state.fox.poseWeights = new Float32Array(
      Array.from({ length: n }, () => [1, 0, 0, 0]).flat(),
    );
    state.fox.n = n;
  }

  //
  // renderer
  //

  const c = { gl, canvas, globalTextureIndex: 0 };

  const camera = Object.assign(createCamera(c), { generation: 0 });
  // window.onresize = () => camera.update(state.camera.eye, state.camera.lookAt); // avoid resizing as it will break the frame buffer textures atm
  camera.update(state.camera.eye, state.camera.lookAt);

  const gizmoRenderer = Object.assign(createGizmoMaterial(c), {
    generation: 0,
  });

  // const triceratopsRenderer = Object.assign(
  //   createInstantiatedSkinnedPosedMeshMaterial(c, {
  //     geometry: await getTriceratopsGeometry(),
  //     colorPalettes: triceratopsColorPalettes,
  //     poses: triceratopsPoses,
  //   }),
  //   { generation: 0 },
  // );

  const foxGeometry = await getFoxGeometry();
  const foxRenderer = Object.assign(
    createInstantiatedSkinnedPosedMeshMaterial(c, {
      geometry: foxGeometry,
      colorPalettes: triceratopsColorPalettes,
      poses: Object.values(foxGeometry.animations).flatMap(({ keyFrames }) =>
        keyFrames.map(({ pose }) => pose),
      ),
    }),
    { generation: 0 },
  );

  const sphereGeometry = createRecursiveSphere();
  const sphereRenderer = Object.assign(
    createBasicMeshMaterial(c, {
      geometry: {
        positions: new Float32Array(sphereGeometry),
        normals: getFlatShadingNormals(sphereGeometry),
      },
    }),
    { generation: 0 },
  );

  //
  // game loop
  //

  const loop = () => {
    //
    // logic
    //
    state.gizmos[1][12] += 0.001;
    state.gizmos.generation++;

    const t = Date.now();

    for (let i = 0; i < state.triceratops.n; i += 1) {
      const k = Math.sin(t * 0.005 + i) * 0.5 + 0.5;
      state.triceratops.poseWeights[i * 4 + 1] = k;
      state.triceratops.poseWeights[i * 4 + 0] = 1 - k;
    }
    state.triceratops.generation++;

    state.sphere.position[0] = Math.sin(t * 0.001) * 200;
    state.sphere.position[2] = 100;
    state.sphere.generation++;

    {
      const animations = Object.entries(foxGeometry.animations).map(
        ([name, a], i, arr) => ({
          name,
          ...a,
          poseOffset: arr
            .slice(0, i)
            .reduce((sum, [, { keyFrames }]) => sum + keyFrames.length, 0),
        }),
      );

      for (let j = state.fox.n; j--; ) {
        const { duration, keyFrames, poseOffset } =
          animations[hash(j) % animations.length];

        const time = (Date.now() / 1000 + hash(j + 7) / 10) % duration;

        let i = 0;
        while (keyFrames[i].time <= time) i++;

        const k = invLerp(time, keyFrames[i - 1].time, keyFrames[i].time);

        state.fox.poseIndexes[j * 4 + 0] = poseOffset + i - 1;
        state.fox.poseIndexes[j * 4 + 1] = poseOffset + i;
        state.fox.poseWeights[j * 4 + 0] = 1 - k;
        state.fox.poseWeights[j * 4 + 1] = k;
      }

      state.fox.generation++;
    }

    //
    // update renderers
    //
    if (state.camera.generation !== camera.generation) {
      camera.update(state.camera.eye, state.camera.lookAt);
      camera.generation = state.camera.generation;
    }
    if (state.gizmos.generation !== gizmoRenderer.generation) {
      gizmoRenderer.update(state.gizmos);
      gizmoRenderer.generation = state.gizmos.generation;
    }
    if (state.sphere.generation !== sphereRenderer.generation) {
      const m = mat4.create();
      const s = 60;
      const q = quat.create();
      mat4.fromRotationTranslationScale(m, q, state.sphere.position, [s, s, s]);
      sphereRenderer.update(
        new Float32Array(m),
        new Float32Array([0.4, 0.4, 0.7]),
      );
      sphereRenderer.generation = state.sphere.generation;
    }
    // if (state.triceratops.generation !== triceratopsRenderer.generation) {
    //   triceratopsRenderer.update(
    //     state.triceratops.positions,
    //     state.triceratops.directions,
    //     state.triceratops.poseIndexes,
    //     state.triceratops.poseWeights,
    //     state.triceratops.paletteIndexes,
    //     state.triceratops.n,
    //   );
    //   triceratopsRenderer.generation = state.triceratops.generation;
    // }
    if (state.fox.generation !== foxRenderer.generation) {
      foxRenderer.update(
        state.fox.positions,
        state.fox.directions,
        state.fox.poseIndexes,
        state.fox.poseWeights,
        state.fox.paletteIndexes,
        state.fox.n,
      );
      foxRenderer.generation = state.fox.generation;
    }

    //
    // draw
    //
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // triceratopsRenderer.draw(camera.worldMatrix);
    foxRenderer.draw(camera.worldMatrix);
    gizmoRenderer.draw(camera.worldMatrix);
    sphereRenderer.draw(camera.worldMatrix);

    //
    // loop
    //
    requestAnimationFrame(loop);
  };
  loop();

  // camera controls
  createOrbitControl(c, state.camera);
})();
