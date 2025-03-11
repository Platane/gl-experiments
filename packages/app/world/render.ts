import { mat4, vec2, vec3 } from "gl-matrix";
import type { World } from "../world/state";
import { createInstantiatedSkinnedPosedMeshMaterial } from "../renderer/materials/instantiatedSkinnedPosedMesh";
import { createAnimationParamsGetter } from "../renderer/materials/instantiatedSkinnedPosedMesh/animation";
import { createGridMaterial } from "../renderer/materials/grid";
import { getSharkModel } from "../renderer/geometries/shark";

export const createRenderer = (
  { gl }: { gl: WebGL2RenderingContext },
  model: {
    shark: Awaited<ReturnType<typeof getSharkModel>>;
    trex: Awaited<ReturnType<typeof getSharkModel>>;
    raptor: Awaited<ReturnType<typeof getSharkModel>>;
    para: Awaited<ReturnType<typeof getSharkModel>>;
  },
) => {
  //
  // camera
  //
  const perspectiveMatrix = mat4.create();
  const lookAtMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const up = [0, 1, 0] as vec3;

  const skinnedMeshMaterial = createInstantiatedSkinnedPosedMeshMaterial({
    gl,
  });

  const sharkAnimationParams = createAnimationParamsGetter(
    model.shark.animations,
  );
  const sharkRenderer = skinnedMeshMaterial.createRenderer({
    ...model.shark,
    poses: sharkAnimationParams.poses,
  });

  const enemyRenderers = [model.trex, model.raptor, model.para].map((model) => {
    const animationParams = createAnimationParamsGetter(model.animations);
    const renderer = skinnedMeshMaterial.createRenderer({
      ...model,
      poses: animationParams.poses,
    });
    return { renderer, animationParams };
  });

  const gridRenderer = createGridMaterial({ gl }, { gridSize: 10 });

  const render = (world: World) => {
    //
    // camera
    //

    mat4.perspective(
      perspectiveMatrix,
      world.camera.fovX,
      world.camera.aspect,
      world.camera.near,
      world.camera.far,
    );

    mat4.lookAt(lookAtMatrix, world.camera.eye, world.camera.lookAt, up);

    mat4.multiply(viewMatrix, perspectiveMatrix, lookAtMatrix);

    //
    //
    //

    for (let i = 0; i < enemyRenderers.length; i++) {
      const { renderer, animationParams } = enemyRenderers[i];
      const indexRange = world.enemies.kindIndexes[i];

      animationParams.applyAnimationParams(
        world.enemies,
        world.enemies,
        indexRange[1] - indexRange[0],
        indexRange[0],
      );

      renderer.update(
        world.enemies,
        indexRange[1] - indexRange[0],
        indexRange[0],
      );
    }

    sharkAnimationParams.applyAnimationParams(world.player, world.player);
    sharkRenderer.update(world.player, 1);

    //
    // draw
    //

    gl.viewport(
      0,
      0,
      world.camera.viewportSize[0],
      world.camera.viewportSize[1],
    );

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gridRenderer.draw(viewMatrix);
    skinnedMeshMaterial.draw(viewMatrix, () => {
      sharkRenderer.render();

      for (const { renderer } of enemyRenderers) renderer.render();
    });
  };

  const dispose = () => {
    gridRenderer.dispose();
    sharkRenderer.dispose();
    skinnedMeshMaterial.dispose();
    for (const { renderer } of enemyRenderers) renderer.dispose();
  };

  return { render, dispose };
};
