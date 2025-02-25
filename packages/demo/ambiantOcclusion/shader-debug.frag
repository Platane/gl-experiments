#version 300 es

precision highp float;

const int sampleCount = SAMPLE_COUNT;

uniform mat4 u_viewMatrix;
uniform mat4 u_viewMatrixInv;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform float u_near;
uniform float u_far;

uniform float u_sampleRadius;
uniform float u_size;
uniform vec3 u_kernel[sampleCount];

in vec2 v_texCoord;

out vec4 fragColor;

float invLerp(float from, float to, float value) {
    return (value - from) / (to - from);
}

float readDepth(sampler2D depthTexture, ivec2 texCoord, float near, float far) {
    float ndc = 2.0 * texelFetch(depthTexture, texCoord, 0).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}
float readDepthUnit(sampler2D depthTexture, ivec2 texCoord) {
    float near = 0.0;
    float far = 1.0;

    float ndc = 2.0 * texelFetch(depthTexture, texCoord, 0).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}

void main() {
    vec4 originScreenSpace = vec4((v_texCoord.xy * 2.0 - 1.0), (2.0 * texture(u_depthTexture, v_texCoord).r) - 1.0, 1.0);
    vec4 originWorldSpace = u_viewMatrixInv * originScreenSpace;
    originWorldSpace.xyz /= originWorldSpace.w;

    vec3 offset = vec3(0.0, 0.0, 0.0);

    vec4 samplePositionWorldSpace = vec4(originWorldSpace.xyz + offset, 1.0);
    vec4 samplePositionScreenSpace = u_viewMatrix * samplePositionWorldSpace;
    samplePositionScreenSpace.xyz /= samplePositionScreenSpace.w;

    float sampleDepth = samplePositionScreenSpace.z;

    vec2 samplePositionCoord = (samplePositionScreenSpace.xy + 1.0) / 2.0;
    float depthAtSamplePosition = (2.0 * texture(u_depthTexture, samplePositionCoord).r - 1.0);

    // show the re-constructed position
    fragColor = vec4((originWorldSpace.xyz + u_size) / (u_size * 2.0), 1.0);

    vec3 normal = texture(u_normalTexture, v_texCoord).xyz * 2.0 - 1.0;

    // for (int i = 0; i < sampleCount; i++) {}
}
