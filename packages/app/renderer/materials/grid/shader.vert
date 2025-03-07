#version 300 es

uniform mat4 u_viewMatrix;

in vec4 a_position;
in vec2 a_texCoord;
in vec3 a_normal;

out vec2 v_texCoord;
out vec3 v_normal;
out float v_depth;

void main() {
    gl_Position = u_viewMatrix * a_position;
    v_depth = gl_Position.z;
    v_texCoord = a_texCoord;
    v_normal = mat3(u_viewMatrix) * a_normal;
    v_normal = normalize(v_normal);
}
