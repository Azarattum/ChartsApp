/**
 * Class for drawing area stacked graphs.
 */
class AreaGraphDrawer extends GraphDrawer {
    constructor(chartDrawer, graph, gl, shaders) {
        super(chartDrawer, graph, gl, shaders);
    }

    //#region Private methods
    _initializeAttributes() {
        this.path = new PathArea(this.graph.vertices, this.chartDrawer.chart.graphs);
        this.stack = this.gl.newStack();

        this.gl.attributes.position = this.path.vertices;
        this.gl.attributes.sum = this.path.sums;
    }
    //#endregion

    //#region Public methods
    /**
     * Draws the graph depending on current settings.
     */
    draw() {
        super.draw();

        const count = this.cuts.end * 2;
        const offset = this.cuts.start * 2;
        this.gl.drawShape(count, offset);
    }
    //#endregion
}