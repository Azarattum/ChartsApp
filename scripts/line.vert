attribute vec2 position;
attribute vec2 next;
attribute vec2 previous;
attribute float direction;
uniform mat3 projection;
uniform float aspect;

uniform float thickness;
uniform int miter;

void main() {
	vec2 aspectVector = vec2(aspect, 1.0);
	vec2 fix = vec2(2.0, 1.0);
	vec2 previousProjected = (projection * vec3(fix * previous, 1.)).xy;
	vec2 currentProjected = (projection * vec3(fix * position, 1.)).xy;
	vec2 nextProjected = (projection * vec3(fix * next, 1.)).xy;

	//Devide by W and correct with aspect
	vec2 currentPoint = currentProjected.xy * aspectVector;
	vec2 previousPoint = previousProjected.xy * aspectVector;
	vec2 nextPoint = nextProjected.xy * aspectVector;

	float length = thickness;
	float orientation = direction;

	//Starting point uses (next - current)
	vec2 normal = vec2(0.0);
	if (currentPoint == previousPoint) {
		normal = normalize(nextPoint - currentPoint);
	}
	//Ending point uses (current - previous)
	else if (currentPoint == nextPoint) {
		normal = normalize(currentPoint - previousPoint);
	}
	//Join in the middle
	else {
		//Get current line
		vec2 line = normalize((currentPoint - previousPoint));
		if (miter == 1) {
			//Get the next line
			vec2 nextLine = normalize((nextPoint - currentPoint));

			//Compute the miter join: normal and length
			vec2 tangent = normalize(line + nextLine);
			vec2 temp = vec2(-line.y, line.x);
			vec2 miter = vec2(-tangent.y, tangent.x);

			normal = tangent;
			length = thickness / dot(miter, temp);
		} else {
			normal = line;
		}
	}

	normal = vec2(-normal.y, normal.x);
	normal *= length / 2.0;
	normal.x /= aspect;

	gl_Position = vec4(currentProjected + normal * orientation, 0.0, 1.0);
	gl_PointSize = 1.0;
}