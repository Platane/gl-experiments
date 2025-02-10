#version 300 es
precision highp float;

out ivec4 fragColor;

void main() {
    fragColor = ivec4(100, 200, 300, 400);

    fragColor = ivec4(gl_FragCoord.x, gl_FragCoord.y, 1.0, 1.0);

    if (sqrt(pow(gl_FragCoord.x - 80.0, 2.0) + pow(gl_FragCoord.y - 50.0, 2.0)) < 30.0)
        fragColor = ivec4(200, 200, 0, 0);
}
