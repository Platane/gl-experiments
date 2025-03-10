import * as THREE from "three";

export const extractVertexColors = (
  uvs: Float32Array | undefined,
  materials: THREE.Material | THREE.Material[],
) => {
  const material = Array.isArray(materials) ? materials[0] : materials;

  const map = (material as THREE.MeshStandardMaterial)?.map;

  if (!map || !uvs || !(map.source.data instanceof ImageBitmap)) return;

  const canvas = document.createElement("canvas");
  canvas.width = map.source.data.width;
  canvas.height = map.source.data.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(map.source.data, 0, 0);

  const uv = new THREE.Vector2();
  const readPixel = (u: number, v: number) => {
    uv.x = u;
    uv.y = v;

    map.transformUv(uv);

    const color = ctx.getImageData(
      Math.round(uv.x * map.source.data.width),
      Math.round(uv.y * map.source.data.height),
      1,
      1,
    ).data;

    return color;
  };

  const packColor = (color: ArrayLike<number>) =>
    (color[0] << 16) + (color[1] << 8) + color[2];
  const unpackColor = (key: number) => [key >> 16, (key >> 8) % 256, key % 256];

  const colors = new Map<number, number>();

  const colorIndexes = new Uint8Array(uvs.length / 2);

  for (let i = colorIndexes.length; i--; ) {
    const color = readPixel(uvs[i * 2 + 0], uvs[i * 2 + 1]);

    const key = packColor(color);

    let index = colors.get(key);
    if (index === undefined) colors.set(key, (index = colors.size));

    colorIndexes[i] = index;
  }

  const colorCount = colors.size;
  const colorPalette = new Uint8Array(
    [...colors.entries()]
      .sort(([, a], [, b]) => a - b)
      .flatMap(([c]) => unpackColor(c)),
  );

  return { colorCount, colorPalette, colorIndexes };
};
