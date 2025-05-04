#version 300 es
#define clip_cull_distance_extension
#extension GL_ANGLE_clip_cull_distance : enable

precision highp float;

// attributes
in vec4 a_position;
in vec4 a_normal;

// uniforms
uniform mat4 u_viewMatrix;
uniform mat4 u_objectMatrix;
uniform vec4 u_clippingPlane;
uniform vec3 u_color;

out vec3 v_normal;
out vec3 v_color;
out float v_clippingDistance;

void main() {

    gl_Position = u_viewMatrix * u_objectMatrix * a_position;

    v_normal = mat3( u_objectMatrix ) * vec3(a_normal);

    v_normal = normalize(v_normal);

    v_color = u_color.rgb;

    v_clippingDistance = dot( u_objectMatrix * a_position, u_clippingPlane );

    #ifdef clip_cull_distance_extension
        gl_CullDistance[0] = v_clippingDistance;
    #endif
}
