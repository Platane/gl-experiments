#version 300 es

in uvec2 a_viewportSize;

in vec4 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;
flat out uvec2 v_viewportSize;

void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
    v_viewportSize = a_viewportSize;
}
