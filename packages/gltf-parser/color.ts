import * as THREE from "three";

export const extractVertexColors = (
  uvs: Float32Array | undefined,
  materials: THREE.Material | THREE.Material[],
  vertexCount: number,
  { colorEqualsThreehold = 1 }: { colorEqualsThreehold?: number } = {},
) => {
  const material = (
    Array.isArray(materials) ? materials[0] : materials
  ) as THREE.MeshStandardMaterial;

  const map = material?.map;

  if (!map || !uvs || !(map.source.data instanceof ImageBitmap)) {
    if (material.color) {
      return {
        colorIndexes: new Uint8Array(Array.from({ length: vertexCount })),
        colorCount: 1,
        colorPalette: new Uint8Array([
          material.color.r * 255,
          material.color.g * 255,
          material.color.b * 255,
        ]),
      };
    }

    return;
  }

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

  const colorMap = new Map<number, number>();

  const colorIndexes = new Uint8Array(uvs.length / 2);

  for (let i = 0; i < colorIndexes.length; i += 3) {
    const colors = [
      readPixel(uvs[(i + 0) * 2 + 0], uvs[(i + 0) * 2 + 1]),
      readPixel(uvs[(i + 1) * 2 + 0], uvs[(i + 1) * 2 + 1]),
      readPixel(uvs[(i + 2) * 2 + 0], uvs[(i + 2) * 2 + 1]),
    ];
    const keys = colors.map(packColor);

    // pick the keys with the highest count
    const color = keys[0] === keys[1] ? colors[0] : colors[1];

    const closeColor = [...colorMap.keys()]
      .map((key) => {
        const c = unpackColor(key);
        const distance = Math.hypot(
          c[0] - color[0],
          c[1] - color[1],
          c[2] - color[2],
        );
        return { distance, key };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    const key =
      closeColor && closeColor.distance < colorEqualsThreehold
        ? closeColor.key
        : packColor(color);

    let index = colorMap.get(key);
    if (index === undefined) colorMap.set(key, (index = colorMap.size));

    colorIndexes[i + 0] = index;
    colorIndexes[i + 1] = index;
    colorIndexes[i + 2] = index;
  }

  const colorCount = colorMap.size;
  const colorPalette = new Uint8Array(
    [...colorMap.entries()]
      .sort(([, a], [, b]) => a - b)
      .flatMap(([c]) => unpackColor(c)),
  );

  return { colorCount, colorPalette, colorIndexes };
};
