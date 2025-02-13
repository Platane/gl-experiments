#version 300 es

precision highp float;
precision highp isampler2D;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;

uniform vec2 u_depthRange;

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

    float near = u_depthRange.x;
    float far = u_depthRange.y;

    float depth = readDepth(u_depthTexture, pixel.xy, near, far);

    float o = invLerp(1.0, 4.0, depth);
    fragColor = vec4(o, o, o, 1.0);
}
