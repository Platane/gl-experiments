import { mat4, quat, vec3 } from "gl-matrix";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBasicMeshMaterial } from "../../app/renderer/materials/basicMesh";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import { getGeometry as getFoxGeometry } from "../../app/renderer/geometries/fox";
import { createLookAtCamera, resizeViewport } from "../../app/renderer/camera";

(async () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2")!;

  const basicMaterial = createBasicMeshMaterial({ gl });

  const sphereGeometry = createRecursiveSphere();
  const sphereRenderer = basicMaterial.createRenderer({
    geometry: {
      positions: new Float32Array(sphereGeometry),
      normals: getFlatShadingNormals(sphereGeometry),
    },
  });
  const sphereColor = new Float32Array([0.4, 0.4, 0.7]);
  const sphereTransform = mat4.create() as Float32Array;

  const foxGeometry = await getFoxGeometry();
  const foxRenderer = basicMaterial.createRenderer({ geometry: foxGeometry });
  const foxColor = new Float32Array([0.72, 0.7, 0.4]);
  const foxTransform = mat4.create() as Float32Array;

  //
  // camera
  //

  const camera = createLookAtCamera({ canvas });
  resizeViewport({ gl, canvas });

  //
  // loop
  //

  const loop = () => {
    //
    // logic
    //
    {
      const s = 0.15;
      const q = quat.create();
      mat4.fromRotationTranslationScale(
        sphereTransform,
        q,
        [0.2, 0.4, 0.4],
        [s, s, s],
      );
      sphereRenderer.update(sphereTransform, sphereColor);
    }

    {
      const s = 0.01;
      const q = quat.create();
      mat4.fromRotationTranslationScale(foxTransform, q, [0, 0, 0], [s, s, s]);
      foxRenderer.update(foxTransform, foxColor);
    }

    camera.update([1, 1, 2], [0, 0, 0]);

    //
    // draw
    //
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    basicMaterial.draw(camera.worldMatrix, [sphereRenderer, foxRenderer]);

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
