/**
 * This class exteds Path class to path areas.
 */
class PathArea extends Path {
    constructor(points) {
        super(points);

        points.forEach(point => {
            this.vertices.push(point.x, point.y, point.x, -1);
        });
    }
}