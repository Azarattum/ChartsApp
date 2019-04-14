/**
 * This class exteds Path class to path areas.
 */
class PathArea extends Path {
    constructor(points, graphs) {
        super(points);
        //#region Properties
        this.sums = [];
        this.uppers = [];
        this.bases = [];
        //#endregion

        //Fill up the verteces
        points.forEach(point => {
            this.vertices.push(point.x, point.y, point.x, -1);
        });

        //Fill up the sums
        points.forEach((point, index) => {
            const sum = graphs.reduce((a, b) => {
                if (b.vertices[index].y > a) {
                    return b.vertices[index].y;
                }
                else {
                    return a;
                }
            }, 0);
            this.sums.push(sum, 0);
        });

        //Fill up the bases
        points.forEach((point, index) => {
            this.bases.push(1, 0, 0, 1);
        });

        //Fill up upper points
        const thisIndex = graphs.indexOf(graphs.find(x => x.vertices == points));
        points.forEach((point, index) => {
            for (const graph in graphs) {
                if (!this.uppers[graph]) {
                    this.uppers[graph] = [];
                }

                if (graph < thisIndex) {
                    this.uppers[graph].push(graphs[graph].vertices[index].y + 1);
                    this.uppers[graph].push(graphs[graph].vertices[index].y + 1);
                    this.uppers[graph].push(graphs[graph].vertices[index].y + 1);
                    this.uppers[graph].push(graphs[graph].vertices[index].y + 1);
                } else {
                    this.uppers[graph].push(0);
                    this.uppers[graph].push(0);
                    this.uppers[graph].push(0);
                    this.uppers[graph].push(0);
                }
            }
        });
    }
}