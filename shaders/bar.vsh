attribute vec2 position;
attribute float pointer;
attribute float base;
/*/repeat uppers/*/
attribute float upper/*/i/*/;

uniform float visible[/*/uppers/*/];
uniform mat3 projection;

uniform int selected;
varying float opacity;

void main() {
	if (selected == -1 || selected == int(pointer)) {
		opacity = 1.;
	} else {
		opacity = .5;
	}

	vec3 tranformed = vec3(position, 1.);
	float upwards = 0.;
	/*/repeat uppers/*/
	upwards += upper/*/i/*/ * visible[/*/i/*/];

	if (base == 0.) {
		tranformed.y = (tranformed.y + 1.) * visible[/*/current/*/] - 1.;
	}

	tranformed.y += upwards;

	gl_Position = vec4(projection * tranformed, 1.0);
	gl_PointSize = 1.0;
}