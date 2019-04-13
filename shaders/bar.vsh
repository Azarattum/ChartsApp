attribute vec2 position;
attribute int pointer;
uniform mat3 projection;

uniform int selected;
varying float opacity;

void main() {
	if (selected == -1 || selected != pointer) {
		opacity = 1.;
	} else {
		opacity = .5;
	}

	gl_Position = vec4(projection * vec3(position, 1.), 1.0;
	gl_PointSize = 1.0;
}