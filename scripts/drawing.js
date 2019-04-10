class GraphDrawer {
    /**
     * Creates an object for drawing graphs.
     * @param {Graph} graph The graph to draw.
     */
    constructor(graph, gl, bottom = 0) {
        //#region Properties
        /**The graph to draw.*/
        this.graph = graph;
        /**Visible graph area.*/
        this.area = {
            start: 0,
            end: 1
        };
        /**Bottom offset (used to create space for the legend)*/
        this.bottom = bottom;
        /**Whether the graph is visible or not.*/
        this.baseColor = this.graph.color;
        /**Drawing GL object.*/
        this.gl = gl;
        /**GL stack is.*/
        this.stack = gl.newStack();
        /**Path object of the graph.*/
        this.path = new Path(graph.vertices);
        /**Visibility state of the graph.*/
        this.visibilityState = true;
        /**Whethe the graph needs to redraw.*/
        this.redraw = true;
        //#endregion

        gl.indices = this.path.indices;

        gl.attributes.position = this.path.vertices;
        gl.attributes.next = this.path.nexts;
        gl.attributes.previous = this.path.previouses;
        gl.attributes.direction = this.path.directions;

        console.debug("GraphDrawer created", this);
    }

    set start(value) {
        this.area.start = value;
        this.redraw = true;
    }
    
    get start() {
        if (this.area.start instanceof AnimationObject) {
            return this.area.start.get();
        } else {
            return this.area.start;
        }
    }

    set end(value) {
        this.area.end = value;
        this.redraw = true;
    }
    
    get end() {
        if (this.area.end instanceof AnimationObject) {
            return this.area.end.get();
        } else {
            return this.area.end;
        }
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
        if (this.color.a == 255) {
            return true;
        } else if (this.color.a == 0){
            return false;
        } else {
            return this.visibilityState;
        }
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

    toggle() {
        this.color = new Color(this.color.r, this.color.g, this.color.b, +(!this.visible) * 255);
        this.visibilityState =! this.visibilityState;
    }

    /**
     * Draws the graph depending on current settings.
     */
    draw(minY, maxY, start, end) {
        //Zoom: 1 / (end - start)
        //Translation: start * zoom + offset
        ///!!!CHECK PROPER TRANSFORM IMPLEMENTATION. CURRECT: THEORETICAL
        const zoomX = 1 / (this.end - this.start);
        const zoomY = 1 / (maxY - minY);
        const moveX = -this.start * zoomX;
        const moveY = this.bottom / this.gl.viewport.height + minY;
        const projection = [
            zoomX, 0, 0,
            0, zoomY, 0,
            moveX, moveY, 1
        ];

        this.gl.stack = this.stack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = this.color.toArray();
        ///!!!IMPLIMENT PROPER COUNT CONVERTION
        this.gl.drawElements(this.path.length - start * 6, end * 6);
        if (!this.color.inProgress) {
            this.redraw = false;
        }
    }
}

class ChartDrawer {
    /**
     * Creates an object for drawing charts.
     * @param {Chart} chart The chart to draw.
     */
    constructor(chart, canvas, program, bottom = 0) {
        //#region Properties
        /**Drawing canvas.*/
        this.canvas = canvas;
        /**GL Object.*/
        this.gl = new GL(canvas, program);
        /**Graph drawer objects.*/
        this.graphDrawers = [];
        /**The selection.*/
        this.selection = {
            date: null,
            values: []
        };
        /**Visible graphs area.*/
        this.area = {
            start: 0,
            end: 1
        };
        /**Whether the chart needs to redraw.*/
        this.redraw = true;
        /**Layout drawer object.*/
        //this.layoutDrawer = new LayoutDrawer(canvas);
        /**Whether draw layout or not.*/
        //this.layout = true;
        /**The user defined offsets.*/
        this.bottom = bottom;
        //#endregion

        //Perform initial update
        this.update();

        //Initilizing graph drawers
        for (const graph of chart.graphs) {
            this.graphDrawers.push(new GraphDrawer(graph, this.gl, bottom));
        }

        console.debug("ChartDrawer created", this);
    }

    /**
     * Sets the start drawing point.
     * @param {Number} percent The percentage(0-1) of drawing start point.
     */
    set start(percent) {
        if (percent > 1) percent = 1;
        if (percent < 0) percent = 0;

        //Set start to all graphs
        for (const drawer of this.graphDrawers) {
            drawer.start = percent;
        }
        this.area.start = percent;
        this.redraw = true;
    }

    /**
     * Sets the end drawing point.
     * @param {Number} percent The percentage(0-1) of drawing end point.
     */
    set end(percent) {
        if (percent > 1) percent = 1;
        if (percent < 0) percent = 0;

        //Set end to all graphs
        for (const drawer of this.graphDrawers) {
            drawer.end = percent;
        }
        this.area.end = end;
        this.redraw = true;
    }

    /**
     * Sets the postion of selection line.
     * @param {Number} percent The percentage of selected point.
     */
    set select(percent) {
        this.redraw = true;
        if (percent == undefined) {
            this.selection = null;
            return;
        }
        this.selection = percent;
    }

    /**
     * Toggles or sets graph's visibility state by id.
     * @param {Number} id Graph id.
     * @param {Boolean} state Visibility state.
     */
    toggle(id, state = undefined) {
        const drawer = this.graphDrawers[id];
        if (state != drawer.visible) {
            drawer.toggle();
        }
        this.redraw = true;
    }

    /**
     * Updates sizes and colors.
     */
    update() {
        this.gl.resize();
        this.gl.uniforms.aspect = this.gl.viewport.width / this.gl.viewport.height;
        this.gl.uniforms.thickness = 5 / this.canvas.height;
    }

    /**
     * Draws all charts.
     */
    draw() {
        if (this.redraw || this.graphDrawers.some(x => x.redraw)) {
            this.gl.background = new Color(
                getComputedStyle(document.getElementsByClassName("page")[0])
                .getPropertyValue("--color-background")
            );
            this.gl.clear();
            //if (this.layout) this.drawSelection();
            this.drawGraphs();
            //if (this.layout) this.drawLayout();
        }
        this.redraw = false;
    }

    /**
     * Draws the graphs of the chart.
     */
    drawGraphs() {
        //Compute values before drawing
        const points = this.graphDrawers[0].graph.points;
        //Estimate index
        let index = Math.round(this.start * points.lenth);
        let previousDistance = Number.MAX_SAFE_INTEGER;
        let goal = this.start * 2 - 1;
        //Search for start index
        while (true) {
            const vertex = this.graphDrawers[0].graph.vertices[index];
            const distance = goal - vertex.x;
            if (distance > 0) {
                index++;
            } else {
                index—-;
            }
            if (Math.abs(previousDistance) > Math.abs(distance)) {
                previousDistance = distance;
            } else {
                break;
            }
        }
        //Save start offset
        const start = index;
        let selectionIndex = null;
        let minSelectionIndex = Number.MAX_SAFE_INTEGER;
        let maxY = -Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        //Go forward and scan
        goal = this.end * 2 - 1;
        const selection = this.selection * 2 - 1;
        while (true) {
            //Wait for the end
            const vertex = this.graphDrawers[0].graph.vertices[index];
            if (vertex.x > goal) {
                break;
            }
            //Calculate selection
            if (this.selection != null) {
                const distance = Math.abs(vertex.x - selection);
                if (distance < minSelectionDistance) {
                    minSelectionDistance = distance;
                    selectionIndex = index;
                }
            }
            //Calculate local maximum ans minimum
            for (const drawer of this.graphDrawers) {
                const graphVertex = drawer.graph.vertices[index];
                if (graphVertex.y > maxY) {
                    maxY = graphVertex.y;
                } else if (graphVertex.y < minY) {
                    minY = graphVertex.y;
                }
            }
            index++;
        }
        
        for (const drawer of this.graphDrawers) {
            drawer.draw(minY, maxY, start, index);
        }
    }

    /**
     * Draws the layout for the chart.
     
    drawLayout() {
        if (this.graph != undefined) {
            let visibleDrawer = this.graph;
            this.layoutDrawer.draw(
                visibleDrawer.bounds,
                visibleDrawer.maxBounds,
                this.offsets.bottom
            );
        }
    }

    /**
     * Draws the selection part of the layout.
     
    drawSelection() {
        if (this.graph != undefined) {
            let visibleDrawer = this.graph;
            if (this.selection.date != null) {
                this.layoutDrawer.drawSelection(
                    this.selection.date,
                    visibleDrawer.bounds,
                    this.offsets.bottom
                );
            }
        }
    }*/
}

/**!!!
 * FOR CHARTDRAWER:
 * gl.uniforms.aspect = canvas.width / canvas.height;
 * gl.uniforms.thickness = 5 / canvas.height;
 * 
 */
