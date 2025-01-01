#version 300 es
precision highp float;

// attributes
in vec4 a_position;
in vec4 a_normal;
in vec3 a_color;

in vec4 a_weights;
in uvec4 a_boneIndexes;

in vec2 a_instancePosition;
in vec2 a_instanceDirection;
in vec4 a_instancePoseWeights;
in uvec4 a_instancePoseIndexes;

// uniforms
uniform mat4 u_viewMatrix;
uniform sampler2D u_posesTexture;

out vec3 v_normal;
out vec3 v_color;

mat4 getBoneMatrix(sampler2D posesTexture, uint poseIndex, uint boneIndex) {
    return mat4(
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 0, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 1, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 2, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 3, int(poseIndex)), 0)
    );
}

mat4 getWeightedBoneMatrix(sampler2D posesTexture, uvec2 instancePoseIndexes, vec2 instancePoseWeights, uvec4 boneIndexes, vec4 poseWeights) {
    mat4 bm0 =
        getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[0]) * poseWeights[0] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[1]) * poseWeights[1] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[2]) * poseWeights[2] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[3]) * poseWeights[3];

    mat4 bm1 =
        getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[0]) * poseWeights[0] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[1]) * poseWeights[1] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[2]) * poseWeights[2] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[3]) * poseWeights[3];

    return bm0 * instancePoseWeights[0] + bm1 * instancePoseWeights[1];
}

void main() {
    mat4 bm = getWeightedBoneMatrix(
            u_posesTexture,
            uvec2(a_instancePoseIndexes),
            vec2(a_instancePoseWeights),
            a_boneIndexes,
            a_weights
        );

    mat3 rot = mat3(
            a_instanceDirection.y, 0, -a_instanceDirection.x,
            0, 1, 0,
            a_instanceDirection.x, 0, a_instanceDirection.y
        );

    vec4 p = vec4((rot * (bm * a_position).xyz), 1.0);

    p.x += a_instancePosition.x;
    p.z += a_instancePosition.y;

    gl_Position = u_viewMatrix * p;

    v_normal = rot * vec3(a_normal);

    //
    // debugger weight
    if (false) {
        uvec3 debugIndexes = uvec3(1, 2, 0);
        vec3 debugWeights = vec3(0.0, 0.0, 0.0);
        if (a_boneIndexes[0] == debugIndexes[0]) {
            debugWeights[0] = a_weights[0];
        } else if (a_boneIndexes[1] == debugIndexes[0]) {
            debugWeights[0] = a_weights[1];
        } else if (a_boneIndexes[2] == debugIndexes[0]) {
            debugWeights[0] = a_weights[2];
        } else if (a_boneIndexes[3] == debugIndexes[0]) {
            debugWeights[0] = a_weights[3];
        }

        if (a_boneIndexes[0] == debugIndexes[1]) {
            debugWeights[1] = a_weights[0];
        } else if (a_boneIndexes[1] == debugIndexes[1]) {
            debugWeights[1] = a_weights[1];
        } else if (a_boneIndexes[2] == debugIndexes[1]) {
            debugWeights[1] = a_weights[2];
        } else if (a_boneIndexes[3] == debugIndexes[1]) {
            debugWeights[1] = a_weights[3];
        }

        if (a_boneIndexes[0] == debugIndexes[2]) {
            debugWeights[2] = a_weights[0];
        } else if (a_boneIndexes[1] == debugIndexes[2]) {
            debugWeights[2] = a_weights[1];
        } else if (a_boneIndexes[2] == debugIndexes[2]) {
            debugWeights[2] = a_weights[2];
        } else if (a_boneIndexes[3] == debugIndexes[2]) {
            debugWeights[2] = a_weights[3];
        }
        v_color = debugWeights;
    }

    // v_color = vec3(a_weights);
    // v_color = vec3(float(a_instancePoseIndexes[0]) / 10.0, a_instancePoseWeights[0], float(a_boneIndexes[0]));
    // v_color = vec3(a_instanceDirection, 0.0);
    v_color = vec3(float(gl_InstanceID) / 100.0, 1.0, 0.0);

    v_color = a_color;
}
