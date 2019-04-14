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

    _initializeProgram() {
        const vertex = new Shader(this.shaders[0], Shader.types.VERTEX);
        const fragment = new Shader(this.shaders[1], Shader.types.FRAGMENT);
        vertex.variables = {
            uppers: this.chartDrawer.chart.graphs.length,
            current: this.chartDrawer.graphDrawers.length
        };
        return this.gl.newProgram(new ShadersProgram(vertex, fragment));
    }
    //#endregion

    //#region Public methods
    /**
     * Draws the graph depending on current settings.
     */
    draw(projection) {
        super.draw(projection);

        const count = this.cuts.end * 2;
        const offset = this.cuts.start * 2;
        this.gl.drawShape(count, offset);
    }
    //#endregion
}