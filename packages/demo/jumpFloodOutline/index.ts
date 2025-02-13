import { mat4, quat, vec3 } from "gl-matrix";
import { createRecursiveSphere } from "../../app/renderer/geometries/recursiveSphere";
import { createBasicMeshMaterial } from "../../app/renderer/materials/basicMesh";
import { getFlatShadingNormals } from "../../app/utils/geometry-normals";
import { getGeometry as getFoxGeometry } from "../../app/renderer/geometries/fox";
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  createLookAtCamera,
  resizeViewport,
} from "../../app/renderer/camera";
import { createOrbitControl } from "../../app/control/orbitCamera";
import { createScreenSpaceProgram } from "../../app/utils/gl-screenSpaceProgram";
import { getUniformLocation } from "../../app/utils/gl";

import codeFragInit from "./shader-jumpFloodInit.frag?raw";
import codeFragDebug from "./shader-debug.frag?raw";
import codeFragStep from "./shader-jumpFloodStep.frag?raw";
import codeFragComposition from "./shader-composition.frag?raw";

const createOutlinePass = ({ gl }: { gl: WebGL2RenderingContext }) => {
  //
  // programs
  //

  const programInit = Object.assign(
    createScreenSpaceProgram(gl, codeFragInit),
    { uniform: { u_texture: null as WebGLUniformLocation | null } },
  );
  programInit.uniform.u_texture = getUniformLocation(
    gl,
    programInit.program,
    "u_texture",
  );

  const programDebug = Object.assign(
    createScreenSpaceProgram(gl, codeFragDebug),
    { uniform: { u_texture: null as WebGLUniformLocation | null } },
  );
  programDebug.uniform.u_texture = getUniformLocation(
    gl,
    programDebug.program,
    "u_texture",
  );

  const programStep = Object.assign(
    createScreenSpaceProgram(gl, codeFragStep),
    { uniform: { u_texture: null as WebGLUniformLocation | null } },
  );
  programStep.uniform.u_texture = getUniformLocation(
    gl,
    programStep.program,
    "u_texture",
  );

  const programComposition = Object.assign(
    createScreenSpaceProgram(gl, codeFragComposition),
    {
      uniform: {
        u_colorTexture: null as WebGLUniformLocation | null,
        u_depthTexture: null as WebGLUniformLocation | null,
        u_closestSeedTexture: null as WebGLUniformLocation | null,
        u_depthRange: null as WebGLUniformLocation | null,
        u_lineWidth: null as WebGLUniformLocation | null,
        u_lineColor: null as WebGLUniformLocation | null,
      },
    },
  );
  programComposition.uniform.u_colorTexture = getUniformLocation(
    gl,
    programComposition.program,
    "u_colorTexture",
  );
  programComposition.uniform.u_closestSeedTexture = getUniformLocation(
    gl,
    programComposition.program,
    "u_closestSeedTexture",
  );
  programComposition.uniform.u_lineWidth = getUniformLocation(
    gl,
    programComposition.program,
    "u_lineWidth",
  );
  programComposition.uniform.u_lineColor = getUniformLocation(
    gl,
    programComposition.program,
    "u_lineColor",
  );

  //
  // framebuffer to store depth and color
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

  const baseFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
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

  //
  // jump flood algorithm frame buffers
  //

  const jfaTexture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, jfaTexture1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RG16I,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    gl.RG_INTEGER,
    gl.SHORT,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const jfaFramebuffer1 = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, jfaFramebuffer1);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    jfaTexture1,
    0,
  );
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  const jfaTexture2 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, jfaTexture2);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RG16I,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    gl.RG_INTEGER,
    gl.SHORT,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const jfaFramebuffer2 = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, jfaFramebuffer2);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    jfaTexture2,
    0,
  );
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const draw = (
    drawOutlinedObject: () => void,
    drawScene: () => void,
    {
      lineWidth = 18,
      lineColor = new Float32Array([0.7, 0.5, 0.22, 1]),
    }: { lineWidth?: number; lineColor?: Float32Array } = {},
  ) => {
    // draw the object to outline
    gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawOutlinedObject();

    // init the jump floor algorithm:
    // write the seeds on the texture1
    {
      gl.useProgram(programInit.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, jfaFramebuffer1);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.uniform1i(programInit.uniform.u_texture, 0);

      programInit.draw();
    }

    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, baseFramebuffer);
      drawScene();
    }

    // jump flood pass
    {
      gl.useProgram(programStep.program);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.uniform1i(programStep.uniform.u_texture, 0);

      for (let k = 0; k <= lineWidth; k++) {
        if (k % 2 === 0) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, jfaFramebuffer2);
          gl.bindTexture(gl.TEXTURE_2D, jfaTexture1);
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, jfaFramebuffer1);
          gl.bindTexture(gl.TEXTURE_2D, jfaTexture2);
        }
        programStep.draw();
      }
    }

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

      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, jfaTexture1);
      gl.uniform1i(programComposition.uniform.u_closestSeedTexture, 2);

      gl.uniform2f(
        programComposition.uniform.u_depthRange,
        CAMERA_NEAR,
        CAMERA_FAR,
      );
      gl.uniform1f(programComposition.uniform.u_lineWidth, lineWidth);
      gl.uniform4fv(programComposition.uniform.u_lineColor, lineColor);

      programComposition.draw();
    }

    // debug pass
    {
      gl.useProgram(programDebug.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, jfaTexture1);
      gl.uniform1i(programDebug.uniform.u_texture, 0);

      programDebug.draw();
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

  const foxGeometry = await getFoxGeometry();
  const foxRenderer = basicMaterial.createRenderer({ geometry: foxGeometry });
  const foxColor = new Float32Array([0.72, 0.7, 0.4]);
  const foxTransform = mat4.create() as Float32Array;

  let outlinePass = createOutlinePass({ gl });

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
  createOrbitControl({ canvas }, camera, () => {
    camera.update(camera.eye, camera.lookAt);
    localStorage.setItem(
      "camera." + location.pathname,
      JSON.stringify({ eye: camera.eye, lookAt: camera.lookAt }),
    );
  });

  window.onresize = () => {
    resizeViewport({ gl, canvas }, { dprMax: 0.3 });
    camera.update(camera.eye, camera.lookAt);

    // reset outline pass
    outlinePass.dispose();
    outlinePass = createOutlinePass({ gl });
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
      // quat.fromEuler(q, 0, -Date.now() * 0.15, 0);
      mat4.fromRotationTranslationScale(
        sphereTransform,
        q,
        [0.5, 0.4, 0.2],
        // [
        //   Math.sin(Date.now() * 0.002) * 0.5,
        //   0.4,
        //   -0.1 + Math.cos(Date.now() * 0.002) * 0.8,
        // ],
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

    outlinePass.draw(
      () => {
        basicMaterial.draw(camera.worldMatrix, [foxRenderer]);
      },
      () => {
        basicMaterial.draw(camera.worldMatrix, [sphereRenderer]);
      },
      { lineWidth: 20 },
    );

    //
    // loop
    //
    requestAnimationFrame(loop);
  };

  loop();
})();
