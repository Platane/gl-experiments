#version 300 es
precision highp float;

// attributes
in vec4 a_position;
in vec4 a_normal;

// uniforms
uniform mat4 u_viewMatrix;

out vec3 v_normal;

void main() {
    gl_Position = u_viewMatrix * a_position;

    v_normal = mat3(u_viewMatrix) * vec3(a_normal);

    v_normal = normalize(v_normal);

    v_normal = (1.0 + v_normal) / 2.0;

    v_normal = (1.0 + vec3(a_normal)) / 2.0;
}
