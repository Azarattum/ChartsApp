/**
 * Class for drawing bar graphs.
 */
class BarGraphDrawer extends GraphDrawer {
    constructor(chart, graph, gl) {
        super(chart, graph, gl);

        this.thickness = 1;
    }

    //#region Private methods
    _initializeAttributes() {
        this.path = new PathLine(this.graph.vertices);
        this.stack = this.gl.newStack();

        this.gl.indices = this.path.indices;
        this.gl.attributes.position = this.path.vertices;
        this.gl.attributes.next = this.path.nexts;
        this.gl.attributes.previous = this.path.previouses;
        this.gl.attributes.direction = this.path.directions;
    }
    //#endregion

    //#region Public methods
    /**
     * Draws the graph depending on current settings.
     */
    draw() {
        super.draw();

        this.gl.uniforms.aspect = this.gl.viewport.width / this.gl.viewport.height;
        this.gl.uniforms.thickness = this.thickness / this.gl.canvas.height;

        const count = (this.cuts.end - 1) * 6;
        const offset = this.cuts.start * 6;
        this.gl.drawElements(count, offset);
    }
    //#endregion
}