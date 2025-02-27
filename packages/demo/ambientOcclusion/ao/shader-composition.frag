#version 300 es

precision highp float;

uniform sampler2D u_ambientOcclusionTexture;
uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;

in vec2 v_texCoord;

out vec4 fragColor;

float invLerp(float from, float to, float value) {
    return (value - from) / (to - from);
}

void main() {
    float ao = texture(u_ambientOcclusionTexture, v_texCoord).r;
    vec4 color = texture(u_colorTexture, v_texCoord);
    vec3 normal = texture(u_normalTexture, v_texCoord).xyz;

    normal = normalize(normal);

    fragColor = color;

    vec3 lightDirection = vec3(0.615457, 0.492365, 0.615457);

    float p = clamp(invLerp(-0.4, 0.8, dot(normal, lightDirection)), 0.0, 1.0);

    fragColor.rgb *= ao;
    fragColor.rgb *= mix(0.6, 1.0, p);

    // fragColor = vec4((normal * 2.0 - 1.0), color.a);
    // fragColor = vec4(ao, ao, ao, 1.0);
}
