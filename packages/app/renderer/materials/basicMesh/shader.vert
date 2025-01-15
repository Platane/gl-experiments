#version 300 es
precision highp float;

// attributes
in vec4 a_position;
in vec4 a_normal;

// uniforms
uniform mat4 u_viewMatrix;
uniform mat4 u_objectMatrix;
uniform vec3 u_color;

out vec3 v_normal;
out vec3 v_color;

void main() {
    gl_Position = u_viewMatrix * u_objectMatrix * a_position;

    v_normal = a_normal.xyz;

    v_color = u_color.rgb;
}
