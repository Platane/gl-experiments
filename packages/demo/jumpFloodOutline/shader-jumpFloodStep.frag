#version 300 es

precision highp int;
precision highp float;
precision highp isampler2D;

uniform isampler2D u_texture;

uniform int u_offsetDistance;

out ivec2 fragColor;

void main() {
    ivec2 origin = ivec2(gl_FragCoord.xy);
    ivec2 size = textureSize(u_texture, 0);

    int minDistanceSq = 999999;

    int offsetDistance = u_offsetDistance;

    fragColor = ivec2(-999, -999);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            ivec2 offset = ivec2(x * offsetDistance, y * offsetDistance);
            ivec2 o = origin + offset;

            if (o.x >= 0 && o.y >= 0 && o.x < size.x && o.y < size.y) {
                ivec2 c = texelFetch(u_texture, o, 0).xy;

                int distanceSq = (c.x - origin.x) * (c.x - origin.x) + (c.y - origin.y) * (c.y - origin.y);

                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    fragColor = c.xy;
                }
            }
        }
    }
}
