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

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_colorTexture, pixel, 0);

    ivec4 closestSeed = texelFetch(u_closestSeedTexture, pixel, 0);

    if (closestSeed.x > 0) {
        int distanceSq = (closestSeed.x - pixel.x) * (closestSeed.x - pixel.x) + (closestSeed.y - pixel.y) * (closestSeed.y - pixel.y);
        float distance = sqrt(float(distanceSq));

        if (distance < u_lineWidth + 1.0) {
            fragColor = u_lineColor;

            float coverage = 1.0 - clamp(invLerp(u_lineWidth, u_lineWidth + 1.0, distance), 0.0, 1.0);

            fragColor.a *= coverage;
        }
    }

    if (color.a > 0.0) {
        fragColor = color;
    }
}
