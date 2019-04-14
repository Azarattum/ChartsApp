/**
 * This class exteds Path class to path areas.
 */
class PathArea extends Path {
    constructor(points, graphs) {
        super(points);
        //#region Properties
        this.sums = [];
        //#endregion

        //Fill up the verteces
        points.forEach(point => {
            this.vertices.push(point.x, point.y, point.x, -1);
        });

        //Fill up the sums
        points.forEach((point, index) => {
            const sum = graphs.reduce((a, b) => {
                return a + b.vertices[index].y;
            }, 0);
            this.sums.push(sum, 0);
        });
    }
}