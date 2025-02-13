#version 300 es

precision highp float;
precision highp isampler2D;

uniform isampler2D u_texture;

out vec4 fragColor;

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    ivec4 color = texelFetch(u_texture, pixel, 0);

    fragColor = vec4(float(color.r) / 300.0, float(color.g) / 300.0, 0.0, 1.0);

    int distanceSq = (pixel.x - color.x) * (pixel.x - color.x) + (pixel.y - color.y) * (pixel.y - color.y);
    float distance = sqrt(float(distanceSq));

    float o = distance / 50.0;
    fragColor = vec4(o, o, o, 1.0);

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
    else discard;
}
