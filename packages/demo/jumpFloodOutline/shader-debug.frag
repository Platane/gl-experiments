#version 300 es

precision highp float;
precision highp isampler2D;
precision highp int;

uniform isampler2D u_texture;

out vec4 fragColor;

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy);
    ivec2 closestSeed = texelFetch(u_texture, coord, 0).xy;

    fragColor = vec4(float(closestSeed.x) / 50.0, float(closestSeed.y) / 100.0, 0.0, 1.0);

    if (closestSeed.x == -999 && closestSeed.y == -999) {
        fragColor = vec4(1.0, 0.6, 0.0, 1.0);

        discard;
    }

    if (closestSeed.x == coord.x && closestSeed.y == coord.y)
        fragColor.b = 1.0;

    int distanceSq = (coord.x - closestSeed.x) * (coord.x - closestSeed.x) + (coord.y - closestSeed.y) * (coord.y - closestSeed.y);
    float distance = sqrt(float(distanceSq));

    // float o = distance / 50.0;
    // fragColor = vec4(o, o, o, 1.0);

    if (
        // distance == 0.0 ||
        abs(distance - 8.0) < 0.5 ||
            abs(distance - 16.0) < 0.5 ||
            abs(distance - 24.0) < 0.5 ||
            abs(distance - 32.0) < 0.5 ||
            abs(distance - 40.0) < 0.5 ||
            abs(distance - 48.0) < 0.5 ||
            abs(distance - 56.0) < 0.5
    )
        fragColor = vec4(0.5, 0.1, 0.8, 1.0);
    // else discard;
}
