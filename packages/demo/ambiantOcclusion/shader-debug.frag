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

uniform float u_sampleRad;
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
    ivec2 coord = ivec2(gl_FragCoord.xy);

    vec4 originScreenSpace = vec4((v_texCoord.xy * 2.0 - 1.0), (2.0 * texture(u_depthTexture, v_texCoord).r) - 1.0, 1.0);
    vec4 originWorldSpace = u_viewMatrixInv * originScreenSpace;
    originWorldSpace.xyz /= originWorldSpace.w;

    // float o = invLerp(-1.0, 1.0, origin.z);
    fragColor = vec4((originWorldSpace.xyz), 1.0);

    // fragColor = vec4(texture(u_depthTexture, v_texCoord).rrr, 1.0);

    vec3 normal = texture(u_normalTexture, v_texCoord).xyz * 2.0 - 1.0;
    // fragColor = vec4(normal, 1.0);

    // vec3 color = texelFetch(u_colorTexture, coord, 0).xyz;
    // float depth = readDepth(u_depthTexture, coord, u_near, u_far);

    // //
    // //

    // float unitDepth = texelFetch(u_depthTexture, coord, 0).r;

    // vec4 position = u_viewMatrixInv * screenPosition;

    // float occlucion = 0.0;

    // vec3 offset = vec3(0.2, 0.0, 0.0);

    // vec4 samplePosition = vec4(position.xyz + offset, 1.0);
    // vec4 sampleScreenPosition = u_viewMatrix * samplePosition;

    // fragColor = vec4(position.www, 1.0);

    // fragColor = vec4(0.3, 0.1, 0.8, 1.0);
    // fragColor = vec4(position.xyz, 1.0);
    // fragColor = vec4(position.xyz, 1.0);
    // fragColor.r = position.x;
    // fragColor.g = position.y;
    // fragColor.b = position.z;
    // fragColor.a = 1.0;

    // ivec2 sampleCoord = ivec2(int(round(sampleScreenPosition.x)), int(round(sampleScreenPosition.y)));
    // float sampleDepth = readDepth(u_depthTexture, sampleCoord, u_near, u_far);

    // if (invLerp(u_near, u_far, sampleDepth) > sampleScreenPosition.z)
    //     fragColor = vec4(1.0, 0.0, 0.5, 1.0);

    // for (int i = 0; i < sampleCount; i++) {}
}
