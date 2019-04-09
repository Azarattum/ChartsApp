class GraphDrawer {
    /**
     * Creates an object for drawing graphs.
     * @param {Graph} graph The graph to draw.
     */
    constructor(graph, gl, offsets = {
        left: 0,
        bottom: 0
    }) {
        //#region Properties
        /**The graph to draw.*/
        this.graph = graph;
        /**Left side of visible graph.*/
        this.leftSide = 0;
        /**Right side of visible graph.*/
        this.rightSide = 1;
        /**Graph offsets (used to create space for the legend)*/
        this.offsets = offsets;
        /**Whether the graph is visible or not.*/
        this.baseColor = this.graph.color;
        /**Drawing canvas.*/
        this.gl = gl;
        /**GL stack is.*/
        this.stack = gl.newStack();
        /**Path object of the graph.*/
        this.path = new Path(graph.vertices);
        //#endregion

        gl.indices = this.path.indices;

        gl.attributes.position = this.path.vertices;
        gl.attributes.next = this.path.nexts;
        gl.attributes.previous = this.path.previouses;
        gl.attributes.direction = this.path.directions;

        console.debug("GraphDrawer created", this);
    }

    set color(value) {
        this.baseColor = new AnimationObject(this.color, value, ANIMATION_PERIOD);
    }

    get color() {
        if (this.baseColor instanceof AnimationObject) {
            return this.baseColor.get();
        } else {
            return this.baseColor;
        }
    }

    /**
     * Visible property. Can be AnimationObject.
     */
    get visible() {
        return !(this.color.a == 0);
    }

    /**
     * Returns the maximum value on the current view.
     */
    get localMaximum() {
        let maximum = -Number.MAX_SAFE_INTEGER;

        for (const x in this.graph.values) {
            if (x < this.bounds.left)
                continue;
            if (x > this.bounds.right)
                break;

            const y = this.graph.values[x];

            if (y > maximum)
                maximum = y;
        }

        return maximum;
    }

    /**
     * Draws the graph depending on current settings.
     */
    draw() {
        const projection = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];

        this.gl.stack = this.stack;
        gl.uniforms.projection = projection;
        gl.uniforms.color = this.color.toArray();
        gl.drawElements(this.path.length);
    }
}

/**!!!
 * FOR CHARTDRAWER:
 * gl.uniforms.aspect = canvas.width / canvas.height;
 *  gl.uniforms.thickness = 5 / canvas.height;
 * 
 */