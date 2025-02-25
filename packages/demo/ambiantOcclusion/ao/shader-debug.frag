#version 300 es

precision highp float;

const int sampleCount = SAMPLE_COUNT;

uniform mat4 u_viewMatrix;
uniform mat4 u_viewMatrixInv;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_noiseTexture;
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

    // get the point in screen space, then project in world space
    vec4 originScreenSpace = vec4((v_texCoord.xy * 2.0 - 1.0), (2.0 * texture(u_depthTexture, v_texCoord).r) - 1.0, 1.0);

    vec4 originWorldSpace = u_viewMatrixInv * originScreenSpace;
    originWorldSpace.xyz /= originWorldSpace.w;

    // show the re-constructed position
    // fragColor = vec4((originWorldSpace.xyz + u_size) / (u_size * 2.0), 1.0);

    // get the normal
    vec3 normal = texture(u_normalTexture, v_texCoord).xyz * 2.0 - 1.0;

    // get a random vector (from the noise texture)
    ivec2 noiseTextureSize = textureSize(u_noiseTexture, 0);
    ivec2 noiseCoord = ivec2(mod(gl_FragCoord.x, float(noiseTextureSize.x)), mod(gl_FragCoord.y, float(noiseTextureSize.y)));
    // vec3 randomVector = texelFetch(u_noiseTexture, noiseCoord, 0).xyz;
    vec3 randomVector = vec3(1.0, 0.0, 0.0);

    // use the Gram-Schmidt process to compute an orthogonal basis
    // * the random vector is supposed to have z=0, and supposedly the normal never have z=0, so they are never collinear
    vec3 u = normalize(randomVector - normal * dot(randomVector, normal));
    vec3 v = cross(u, normal);

    mat3 basis = mat3(u, normal, v);

    // fragColor = vec4((normal + 1.0) / 2.0, 1.0);
    // return;

    //
    //

    float occlusion = 0.0;

    for (int i = 0; i < sampleCount; i++) {
        vec3 offset = u_kernel[i] * u_sampleRadius;

        vec4 samplePositionWorldSpace = vec4(originWorldSpace.xyz + basis * offset, 1.0);

        vec4 samplePositionScreenSpace = u_viewMatrix * samplePositionWorldSpace;
        samplePositionScreenSpace.xyz /= samplePositionScreenSpace.w;

        float sampleDepth = samplePositionScreenSpace.z;

        vec2 samplePositionCoord = (samplePositionScreenSpace.xy + 1.0) / 2.0;
        float depthAtSamplePosition = (2.0 * texture(u_depthTexture, samplePositionCoord).r - 1.0);

        bool inRange = abs(sampleDepth - depthAtSamplePosition) < u_sampleRadius;

        occlusion += float(sampleDepth < depthAtSamplePosition);
    }

    float o = occlusion / float(sampleCount);
    fragColor = vec4(o, o, o, 1.0);
}
