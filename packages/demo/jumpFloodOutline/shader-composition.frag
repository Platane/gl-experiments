#version 300 es

precision highp float;
precision highp isampler2D;

uniform isampler2D u_closestSeedTexture;
uniform sampler2D u_colorTexture;

uniform float u_lineWidth;
uniform vec4 u_lineColor;

out vec4 fragColor;

float readDepth(sampler2D depthTexture, ivec2 texCoord, float near, float far) {
    float ndc = 2.0 * texelFetch(depthTexture, texCoord, 0).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}

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
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_colorTexture, pixel, 0);

    ivec2 closestSeed = texelFetch(u_closestSeedTexture, pixel, 0).xy;

    fragColor = color;

    int distanceSq = (closestSeed.x - pixel.x) * (closestSeed.x - pixel.x) + (closestSeed.y - pixel.y) * (closestSeed.y - pixel.y);
    float distance = sqrt(float(distanceSq));

    float coverage = 1.0 - clamp(invLerp(u_lineWidth - 1.0, u_lineWidth, distance), 0.0, 1.0);
    vec4 lineColor = vec4(u_lineColor.rgb, u_lineColor.a * coverage);

    fragColor = paintOver(color, lineColor);

    //
    // if (closestSeed != pixel) {
    //     fragColor = paintOver(lineColor, color);
    // }
}
