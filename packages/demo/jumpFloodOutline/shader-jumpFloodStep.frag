#version 300 es

precision highp float;
precision highp isampler2D;

uniform isampler2D u_texture;

out ivec2 fragColor;

void main() {
    ivec2 origin = ivec2(gl_FragCoord.xy);

    int minDistanceSq = 9999999;
    ivec2 closestSeed = ivec2(0, 0);

    int offsetDistance = 1;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            ivec2 offset = ivec2(x * offsetDistance, y * offsetDistance);
            ivec2 c = texelFetch(u_texture, origin + offset, 0).xy;

            int distanceSq = (c.x - origin.x) * (c.x - origin.x) + (c.y - origin.y) * (c.y - origin.y);

            if (distanceSq < minDistanceSq && (c.x != 0 || c.y != 0)) {
                minDistanceSq = distanceSq;
                closestSeed = c.xy;
            }
        }
    }

    fragColor = ivec2(closestSeed.xy);
}
