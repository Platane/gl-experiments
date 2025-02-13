#version 300 es

precision highp float;
precision highp isampler2D;

uniform isampler2D u_closestSeedTexture;
uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;

uniform vec2 u_depthRange;
uniform float u_lineWidth;
uniform vec4 u_lineColor;

out vec4 fragColor;

float readDepth(sampler2D depthTexture, ivec2 texCoord, float near, float far) {
    float ndc = 2.0 * texelFetch(depthTexture, texCoord, 0).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_colorTexture, pixel, 0);

    ivec4 closestSeed = texelFetch(u_closestSeedTexture, pixel, 0);

    float pixelDepth = readDepth(u_depthTexture, pixel.xy, u_depthRange.x, u_depthRange.y);

    if (closestSeed.x > 0) {
        int distanceSq = (closestSeed.x - pixel.x) * (closestSeed.x - pixel.x) + (closestSeed.y - pixel.y) * (closestSeed.y - pixel.y);

        float closestSeedDepth = readDepth(u_depthTexture, closestSeed.xy, u_depthRange.x, u_depthRange.y);

        if (float(distanceSq) <= u_lineWidth * u_lineWidth) {
            fragColor = u_lineColor;
        }
    }

    if (color.a > 0.0) {
        fragColor = color;
    }
}
