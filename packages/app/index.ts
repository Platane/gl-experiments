import { mat4, vec3 } from "gl-matrix";
import { createGizmoMaterial } from "./renderer/materials/gizmos";
import { createInstantiatedSkinnedPosedMeshMaterial } from "./renderer/materials/instantiatedSkinnedPosedMesh";
import { createCamera } from "./renderer/camera";
import { clamp } from "./utils/math";
import {
  colorPalettes as triceratopsColorPalettes,
  getGeometry as getTriceratopsGeometry,
  poses as triceratopsPoses,
} from "./renderer/geometries/triceratops";
import hash from "hash-int";

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
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0]),
      poseWeights: new Float32Array([0.5, 0.5, 0, 0]),
      paletteIndexes: new Uint8Array([0]),
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
    const n = 256 * 16;
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

  //
  // renderer
  //

  const c = { gl, canvas, globalTextureIndex: 0 };

  const camera = Object.assign(createCamera(c), { generation: 0 });
  window.onresize = () => camera.update(state.camera.eye, state.camera.lookAt);

  const gizmoRenderer = Object.assign(createGizmoMaterial(c), {
    generation: 0,
  });

  const triceratopsRenderer = Object.assign(
    createInstantiatedSkinnedPosedMeshMaterial(c, {
      geometry: await getTriceratopsGeometry(),
      colorPalettes: triceratopsColorPalettes,
      poses: triceratopsPoses,
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

    //
    // update renderers
    //
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
        state.triceratops.paletteIndexes,
        state.triceratops.n,
      );
      triceratopsRenderer.generation = state.triceratops.generation;
    }

    //
    // draw
    //
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gizmoRenderer.draw(camera.worldMatrix);
    triceratopsRenderer.draw(camera.worldMatrix);

    //
    // loop
    //
    requestAnimationFrame(loop);
  };
  loop();

  // camera controls
  {
    let phi = Math.PI / 8;
    let theta = Math.PI;
    let radius = 6;

    const ROTATION_SPEED = 3.5;

    const update = () => {
      state.camera.eye[0] =
        state.camera.lookAt[0] + radius * Math.sin(theta) * Math.cos(phi);
      state.camera.eye[2] =
        state.camera.lookAt[2] + radius * Math.cos(theta) * Math.cos(phi);
      state.camera.eye[1] = state.camera.lookAt[1] + radius * Math.sin(phi);

      state.camera.generation++;
    };
    update();

    type Handler = (
      touches: { pageX: number; pageY: number; button?: number }[],
    ) => void;

    //

    let rotate_px: number | null = null;
    let rotate_py: number | null = null;

    const rotateStart: Handler = ([{ pageX: x, pageY: y }]) => {
      rotate_px = x;
      rotate_py = y;
    };
    const rotateMove: Handler = ([{ pageX: x, pageY: y }]) => {
      if (rotate_px !== null) {
        const dx = x - rotate_px!;
        const dy = y - rotate_py!;

        theta -= (dx / window.innerHeight) * ROTATION_SPEED;
        phi += (dy / window.innerHeight) * ROTATION_SPEED;

        phi = clamp(phi, Math.PI * 0.0002, Math.PI * 0.42);

        rotate_px = x;
        rotate_py = y;

        update();
      }
    };
    const rotateEnd: Handler = () => {
      rotate_px = null;
    };

    const touchStart: Handler = (touches) => {
      if (touches[0].button === 0) rotateStart(touches);
    };
    const touchMove: Handler = (touches) => {
      rotateMove(touches);
    };
    const touchEnd: Handler = (touches) => {
      rotateEnd(touches);
    };

    canvas.ontouchstart = (event) => touchStart(Array.from(event.touches));
    canvas.ontouchmove = (event) => touchMove(Array.from(event.touches));
    canvas.ontouchend = (event) => touchEnd(Array.from(event.touches));

    canvas.onmousedown = (event) => touchStart([event]);
    canvas.onmousemove = (event) => touchMove([event]);
    canvas.onmouseleave = canvas.onmouseup = (event) => touchEnd([]);
  }
})();
