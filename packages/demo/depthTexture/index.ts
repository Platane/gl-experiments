import { mat4, quat, vec3 } from "gl-matrix";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBasicMeshMaterial } from "../../app/renderer/materials/basicMesh";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  createLookAtCamera,
  resizeViewport,
} from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createScreenSpaceProgram } from "../../app/utils/gl-screenSpaceProgram";
import { getUniformLocation } from "../../app/utils/gl";

import codeFrag from "./shader.frag?raw";
import { loadGLTFwithCache } from "../../gltf-parser/loadGLTF";

const createDepthPass = ({ gl }: { gl: WebGL2RenderingContext }) => {
  //
  // programs
  //

  const programComposition = Object.assign(
    createScreenSpaceProgram(gl, codeFrag),
    {
      uniform: {
        u_colorTexture: null as WebGLUniformLocation | null,
        u_depthTexture: null as WebGLUniformLocation | null,
        u_depthRange: null as WebGLUniformLocation | null,
      },
    },
  );
  programComposition.uniform.u_colorTexture = getUniformLocation(
    gl,
    programComposition.program,
    "u_colorTexture",
  );
  programComposition.uniform.u_depthTexture = getUniformLocation(
    gl,
    programComposition.program,
    "u_depthTexture",
  );
  programComposition.uniform.u_depthRange = getUniformLocation(
    gl,
    programComposition.program,
    "u_depthRange",
  );

  //
  // framebuffer
  //

  const colorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.DEPTH24_STENCIL8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0,
  );

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  const draw = (drawScene: () => void) => {
    // draw the object to outline
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawScene();

    // composition
    {
      gl.useProgram(programComposition.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.uniform1i(programComposition.uniform.u_colorTexture, 0);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(programComposition.uniform.u_depthTexture, 1);

      gl.uniform2f(
        programComposition.uniform.u_depthRange,
        CAMERA_NEAR,
        CAMERA_FAR,
      );

      programComposition.draw();
    }
  };

  const dispose = () => {};

  return { draw, dispose };
};

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

  const [foxGeometry] = await loadGLTFwithCache(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Fox/glTF-Binary/Fox.glb",
    ["fox"],
  );
  const foxRenderer = basicMaterial.createRenderer({
    geometry: {
      positions: foxGeometry.positions,
      normals: getFlatShadingNormals(foxGeometry.positions),
    },
  });
  const foxColor = new Float32Array([0.72, 0.7, 0.4]);
  const foxTransform = mat4.create() as Float32Array;

  let depthPass = createDepthPass({ gl });

  //
  // camera
  //

  const camera = Object.assign(createLookAtCamera({ canvas }), {
    eye: [1, 2, 1] as vec3,
    lookAt: [0, 0, 0] as vec3,
  });
  try {
    Object.assign(
      camera,
      JSON.parse(localStorage.getItem("camera." + location.pathname) ?? ""),
    );
  } catch (e) {}
  createOrbitControl(
    { canvas },
    camera,
    () => {
      camera.update(camera.eye, camera.lookAt);
      localStorage.setItem(
        "camera." + location.pathname,
        JSON.stringify({ eye: camera.eye, lookAt: camera.lookAt }),
      );
    },
    { maxRadius: 4, minRadius: 2.5 },
  );

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dprMax: 2 });
    camera.update(camera.eye, camera.lookAt);

    // reset outline pass
    depthPass.dispose();
    depthPass = createDepthPass({ gl });
  };
  (window.onresize as any)();

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
      quat.fromEuler(q, 0, -Date.now() * 0.15, 0);
      mat4.fromRotationTranslationScale(
        sphereTransform,
        q,
        [
          Math.sin(Date.now() * 0.002) * 0.5,
          0.4,
          -0.1 + Math.cos(Date.now() * 0.002) * 0.8,
        ],
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

    //
    // draw
    //
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    depthPass.draw(() => {
      basicMaterial.draw(camera.worldMatrix, () => {
        foxRenderer.render();
        sphereRenderer.render();
      });
    });

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
