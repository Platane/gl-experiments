#version 300 es

precision highp int;
precision highp float;
precision highp isampler2D;

uniform isampler2D u_closestSeedTexture;
uniform sampler2D u_colorTexture;

uniform float u_lineWidth;
uniform vec4 u_lineColor;

out vec4 fragColor;

float invLerp(float from, float to, float value) {
    return (value - from) / (to - from);
}

// color blending https://en.wikipedia.org/wiki/Alpha_compositing
vec4 paintOver(vec4 colorOver, vec4 colorBehind) {
    float alpha = colorOver.a + colorBehind.a * (1.0 - colorOver.a);
    return vec4(
        (colorOver.rgb * colorOver.a + colorBehind.rgb * colorBehind.a * (1.0 - colorOver.a)) / alpha,
        alpha
    );
}

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_colorTexture, coord, 0);

    ivec2 closestSeed = texelFetch(u_closestSeedTexture, coord, 0).xy;

    int distanceSq = (closestSeed.x - coord.x) * (closestSeed.x - coord.x) + (closestSeed.y - coord.y) * (closestSeed.y - coord.y);
    float distance = sqrt(float(distanceSq));

    float coverage = 1.0 - clamp(invLerp(u_lineWidth - 1.0, u_lineWidth, distance), 0.0, 1.0);
    vec4 lineColor = vec4(u_lineColor.rgb, u_lineColor.a * coverage);

    fragColor = paintOver(color, lineColor);
}
