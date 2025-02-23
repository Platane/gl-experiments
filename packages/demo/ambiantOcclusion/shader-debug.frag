#version 300 es

precision highp float;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;

out vec4 fragColor;

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy);

    vec3 normal = texelFetch(u_normalTexture, coord, 0).xyz;
    vec3 color = texelFetch(u_colorTexture, coord, 0).xyz;

    fragColor = vec4( float(coord.x)/200.0 ,float(coord.y)/400.0,0.4, 1.0);

    fragColor = vec4(color, 1.0);
    fragColor = vec4(normal, 1.0);
}
