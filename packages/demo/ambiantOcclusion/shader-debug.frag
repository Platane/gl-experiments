#version 300 es

precision highp float;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform float u_near;
uniform float u_far;

out vec4 fragColor;

float readDepth(sampler2D depthTexture, ivec2 texCoord, float near, float far) {
    float ndc = 2.0 * texelFetch(depthTexture, texCoord, 0).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}


void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy);

    vec3 normal = texelFetch(u_normalTexture, coord, 0).xyz;
    vec3 color = texelFetch(u_colorTexture, coord, 0).xyz;
    float depth = readDepth(u_depthTexture,coord,u_near,u_far);

    fragColor = vec4( float(coord.x)/200.0 ,float(coord.y)/400.0,0.4, 1.0);

    fragColor = vec4(color, 1.0);
    fragColor = vec4(normal, 1.0);

    float o = depth / 5.0;
    fragColor = vec4(o,o,o, 1.0);
}
