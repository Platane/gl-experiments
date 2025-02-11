#version 300 es
precision highp float;

out ivec2 fragColor;

void main() {
    fragColor = ivec2(gl_FragCoord.x, gl_FragCoord.y);

    // draw a disk at 80,50
    if (sqrt(pow(gl_FragCoord.x - 80.0, 2.0) + pow(gl_FragCoord.y - 50.0, 2.0)) < 30.0)
        fragColor = ivec2(0, 0);
}
