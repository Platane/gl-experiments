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

  const trexAnimationParams = createAnimationParamsGetter(
    model.trex.animations,
  );
  const trexRenderer = skinnedMeshMaterial.createRenderer({
    ...model.trex,
    poses: trexAnimationParams.poses,
  });

  const raptorAnimationParams = createAnimationParamsGetter(
    model.raptor.animations,
  );
  const raptorRenderer = skinnedMeshMaterial.createRenderer({
    ...model.raptor,
    poses: raptorAnimationParams.poses,
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

    sharkAnimationParams.applyAnimationParams(world.player, [
      world.player.animation,
    ]);
    sharkRenderer.update(
      world.player.positions,
      world.player.directions,
      world.player.poseIndexes,
      world.player.poseWeights,
      world.player.colorPaletteIndexes,
      1,
    );

    raptorAnimationParams.applyAnimationParams(
      world.enemies,
      world.enemies.animations,
    );
    raptorRenderer.update(
      world.enemies.positions,
      world.enemies.directions,
      world.enemies.poseIndexes,
      world.enemies.poseWeights,
      world.enemies.colorPaletteIndexes,
      world.enemies.count,
    );

    trexAnimationParams.applyAnimationParams(
      world.enemies,
      world.enemies.animations,
    );
    trexRenderer.update(
      world.enemies.positions,
      world.enemies.directions,
      world.enemies.poseIndexes,
      world.enemies.poseWeights,
      world.enemies.colorPaletteIndexes,
      world.enemies.count,
    );

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
      raptorRenderer.render();
      trexRenderer.render();
    });
  };

  const dispose = () => {
    gridRenderer.dispose();
    sharkRenderer.dispose();
    skinnedMeshMaterial.dispose();
  };

  return { render, dispose };
};
