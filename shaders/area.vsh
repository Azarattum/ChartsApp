attribute vec2 position;
uniform mat3 projection;

void main() {
	gl_Position = vec4(projection * vec3(position, 1.), 1.0);
	gl_PointSize = 1.0;
}