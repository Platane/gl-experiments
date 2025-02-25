import * as THREE from "three";

export const createBoxGeometry = () => {
  const geometry = new THREE.BoxGeometry(2, 2, 2).toNonIndexed();

  const positions = geometry.getAttribute("position").array as Float32Array;
  const normals = geometry.getAttribute("normal").array as Float32Array;

  return { positions, normals };
};
