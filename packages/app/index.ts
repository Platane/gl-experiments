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
import { createOutlinePostEffect } from "./renderer/materials/jumpFloodOutlinePostEffect";
// import { createOutlinePostEffect } from "./renderer/materials/simpleOutlinePostEffect";
import { createState } from "./logic/state";

(async () => {
  const canvas = document.createElement("canvas");

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.imageRendering = "pixelated";

  document.body.appendChild(canvas);

  const gl = canvas.getContext("webgl2", {
    antialias: false,
  }) as WebGL2RenderingContext;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);

  //
  // state
  //

  const foxGeometry = await getFoxGeometry();
  const { state, step: stepLogic } = createState(foxGeometry);

  //
  // renderer
  //

  const c = { gl, canvas };

  const camera = Object.assign(createCamera(c), { generation: 0 });
  // window.onresize = () => camera.update(state.camera.eye, state.camera.lookAt); // avoid resizing as it will break the frame buffer textures atm
  camera.update(state.camera.eye, state.camera.lookAt);

  const gizmoRenderer = Object.assign(createGizmoMaterial(c), {
    generation: 0,
  });

  const meshMaterial = createInstantiatedSkinnedPosedMeshMaterial(c);

  const foxRenderer = Object.assign(
    meshMaterial.createRenderer({
      geometry: foxGeometry,
      colorPalettes: triceratopsColorPalettes,
      poses: Object.values(foxGeometry.animations).flatMap(({ keyFrames }) =>
        keyFrames.map(({ pose }) => pose),
      ),
    }),
    { generation: 0 },
  );

  const triceratopsRenderer = Object.assign(
    meshMaterial.createRenderer({
      geometry: await getTriceratopsGeometry(),
      colorPalettes: triceratopsColorPalettes,
      poses: triceratopsPoses,
    }),
    { generation: 0 },
  );

  const sphereGeometry = createRecursiveSphere();
  const sphereMaterial = createBasicMeshMaterial(c);
  const sphereRenderer = Object.assign(
    sphereMaterial.createRenderer({
      geometry: {
        positions: new Float32Array(sphereGeometry),
        normals: getFlatShadingNormals(sphereGeometry),
      },
    }),
    { generation: 0 },
  );
  const outLinePostEffect = createOutlinePostEffect(c);

  //
  // game loop
  //

  const loop = () => {
    //
    // step logic
    //
    stepLogic();

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
      const s = 120;
      const q = quat.create();
      mat4.fromRotationTranslationScale(m, q, state.sphere.position, [s, s, s]);
      sphereRenderer.update(
        new Float32Array(m),
        new Float32Array([0.4, 0.4, 0.7]),
      );
      sphereRenderer.generation = state.sphere.generation;
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

    outLinePostEffect.draw(() =>
      meshMaterial.draw(camera.worldMatrix, [foxRenderer, triceratopsRenderer]),
    );
    gizmoRenderer.draw(camera.worldMatrix);
    sphereMaterial.draw(camera.worldMatrix, [sphereRenderer]);

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();

  // camera controls
  createOrbitControl(c, state.camera);
})();
