attribute vec2 position;
attribute float sum;
uniform mat3 projection;

void main() {
	if (sum == 1.) {}
	vec3 percentedPosition = vec3(position, 1.);
	//percentedPosition.y /= 4.;

	gl_Position = vec4(projection * percentedPosition, 1.0);
	gl_PointSize = 1.0;
}