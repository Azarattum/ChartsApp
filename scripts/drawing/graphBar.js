/**
 * Class for drawing bar graphs.
 */
class BarGraphDrawer extends GraphDrawer {
    constructor(chartDrawer, graph, gl, shaders) {
        super(chartDrawer, graph, gl, shaders);
    }

    //#region Private methods
    _initializeAttributes() {
        this.path = new PathBar(this.graph.vertices);
        this.stack = this.gl.newStack();

        this.gl.indices = this.path.indices;
        this.gl.attributes.position = this.path.vertices;
        this.gl.attributes.pointer = this.path.pointers;
    }
    //#endregion

    //#region Public methods
    /**
     * Draws the graph depending on current settings.
     */
    draw() {
        super.draw();

        this.gl.uniforms.selected = -1;

        const count = (this.cuts.end - 1) * 6;
        const offset = this.cuts.start * 6;
        this.gl.drawElements(count, offset);
    }
    //#endregion
}