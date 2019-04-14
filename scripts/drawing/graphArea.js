/**
 * Class for drawing area stacked graphs.
 */
class AreaGraphDrawer extends GraphDrawer {
    constructor(chart, graph, gl, shaders) {
        super(chart, graph, gl, shaders);

        this.thickness = 1;
    }

    //#region Private methods
    _initializeAttributes() {
        this.path = new PathArea(this.graph.vertices);
        this.stack = this.gl.newStack();

        this.gl.attributes.position = this.path.vertices;
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