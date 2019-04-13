/**
 * This class exteds Path class to path bars.
 */
class PathBar extends Path {
    constructor(points) {
        super(points);
        //#region Properties
        this.pointers = [];
        //#endregion

        //Fill up the verteces
        const amplitude = (points[1].x - points[0].x);
        points.forEach(point => {
            this.vertices.push(
                point.x, -1,
                point.x, point.y,
                point.x + amplitude, point.y,
                point.x + amplitude, -1
            );
        });

        //Fill up the indices
        let j = 0;
        let index = 0;
        points.forEach(point => {
            let i = index;
            this.indices[j++] = i + 0;
            this.indices[j++] = i + 1;
            this.indices[j++] = i + 2;
            this.indices[j++] = i + 2;
            this.indices[j++] = i + 0;
            this.indices[j++] = i + 3;
            index += 4;
        });

        //Fill up the pointers
        points.forEach((point, index) => {
            this.pointers.push(index, index, index, index);
        });
    }
}