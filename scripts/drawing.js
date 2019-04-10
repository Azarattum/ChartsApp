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
        this.selection = null;
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
        this.layout = true;
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
        let selectionX = null;
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
                    selectionX = vertex.x;
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
        
        if (this.layout) this.drawSelection(selectionX);
        
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
    }*/

    /**
     * Draws the selection part of the layout.
     */
    drawSelection(x) {
        
    }
    
}

class LayoutDrawer {
    /**
     * Creates an object for drawing a layout.
     * @param {Element} canvas The canvas for drawing layout.
     */
    constructor(canvas, gl) {
        //#region Properties
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.gl = gl;
        /**Amount of line to draw.*/
        this.lineCount = 6;
        this.dateCount = 7;
        this.dateScale = 4;
        //#endregion
        
        /**Selection stack id*/
        this.selectionStack = this.gl.newStack();
        
        let path = new Path([
            new Point(0, -1),
            new Point(0, 1)
        ]);
        this.gl.indices = path.indices;

        this.gl.attributes.position = path.vertices;
        this.gl.attributes.next = path.nexts;
        this.gl.attributes.previous = path.previouses;
        this.gl.attributes.direction = path.directions;

        /**Line stack id*/
        this.linesStack = this.gl.newStack();
        
        let lines = [];
        for (let i = 0; i < this.lineCount; i++) {
            lines.push(new Point(-1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1));
            lines.push(new Point(1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1));
        }
        
        let path = new Path(lines);
        this.gl.indices = path.indices;

        this.gl.attributes.position = path.vertices;
        this.gl.attributes.next = path.nexts;
        this.gl.attributes.previous = path.previouses;
        this.gl.attributes.direction = path.directions;

        console.debug("LayoutDrawer created", this);
    }

    /**
     * Returns size of viewing area.
     */
    get view() {
        return {
            width: +this.canvas.width,
            height: +this.canvas.height
        };
    }

    /**
     * Draws the layout.
     * @param {Object} bounds Graph drawer current bounds.
     * @param {Number} bottom Margin from the bottom (for dates).
     */
    draw(bounds, maxBounds, bottom) {
        //Update colors
        this.lineColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.25)";
        this.textColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.5)";

        this.drawLines(bounds, maxBounds, bottom);

        this.context.fillStyle = this.textColor;
        this.context.font = (bottom / 2) + "px " +
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"];

        this.drawDates(bounds, maxBounds, bottom);
    }

    /**
     * Draws layout lines.
     * @param {Object} bounds Graph drawer current bounds.
     * @param {Number} bottom Margin from the bottom (for dates).
     */
    drawLines(bottom) {
        //Zoom: 1 / (end - start)
        //Translation: start * zoom + offset
        ///!!!ZOOM Y TO MATCH BOTTOM OFFSET
        const projection = [
            1, 0, 0,
            0, 1, 0,
            0, bottom, 1
        ];

        this.gl.stack = this.linesStack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = new Color(200, 200, 200, 150);
        this.gl.drawElements((this.lineCount * 2 - 1) * 6);
    }

    /**
     * Draws layout dates.
     * @param {Object} bounds Graph drawer current bounds.
     * @param {Number} bottom Margin from the bottom (for dates).
     */
    drawDates(bounds, maxBounds, bottom) {
        const margin = (bottom / 2) + (bottom - (bottom / 2)) / 2 - bottom;
        const left = bounds.left - maxBounds.left;

        const size = (bounds.right - bounds.left);
        const spacing = this.view.width / (this.dateCount - 1);
        const area = size / (this.dateCount - 1);

        const maxSize = (maxBounds.right - maxBounds.left);
        const zoom = size / maxSize;
        const ratio = size / this.view.width;

        const offset = ((left * zoom) % area) / ratio;

        let scale = 1 / Math.pow(2, this.dateScale + 1);

        for (let i = 0; i < this.dateCount; i++) {
            let x = spacing / Math.pow(2, this.dateScale) * i;
            let x0 = x;

            x -= offset;

            for (let s = Math.pow(2, this.dateScale); s >= 2; s /= 2) {
                let expected = Math.pow(2, (this.dateScale - Math.log2(s)));
                if (expected > this.dateCount) {
                    expected = expected % this.dateCount;
                } else if (expected == this.dateCount) {
                    expected = 1;
                }

                let modulo = (i % (expected * 2)) - (i % expected);

                if (zoom > (1 / s)) {
                    scale = (1 / s);
                    if (modulo == expected) {
                        x += spacing * (this.dateCount / s);
                        x0 += spacing * (this.dateCount / s);
                    }
                }
            }

            while (x / scale < (-bottom * 3)) {
                x += spacing * (this.dateCount * scale * 2);
                x0 += spacing * (this.dateCount * scale * 2);
            }

            x /= zoom;
            x0 /= zoom;

            const int = 1 / zoom;
            const min = 1 / scale / 2;
            const max = 1 / scale;
            if ((int - min) / (max - min) < 0.25 && scale < 0.5) {
                this.context.globalAlpha = ((x0 + spacing) % (spacing * 2)) / (spacing / 4);
            }

            this.drawDate(bounds, ratio, margin, x);
            this.context.globalAlpha = 1;
        }
    }

    /**
     * Draws the date based on graph bounds and provided coordinate.
     * @param {Object} bounds Graph bounds.
     * @param {Number} ratio Ratio between bounds size and viewing size.
     * @param {Number} margin Bottom magin.
     * @param {Number} x Coordinate to draw.
     */
    drawDate(bounds, ratio, margin, x) {
        let label = Math.round(bounds.left + x * ratio);
        label = (new Date(label)).toString().split(' ')[1] + " " +
            (new Date(label)).toString().split(' ')[2];

        this.context.fillText(label, x, this.view.height + margin);
    }

    /**
     * Draws the selection line
     * @param {Number} x Date of line coordinate.
     * @param {Number} bottom Margin from the bottom (for dates).
     */
    drawSelection(x, bottom) {
        //Zoom: 1 / (end - start)
        //Translation: start * zoom + offset
        ///!!!BOTTOM OFFSET IS NOT INPLEMENTED YET
        const projection = [
            1, 0, 0,
            0, 1, 0,
            x, bottom, 1
        ];

        this.gl.stack = this.selectionStack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = new Color(200, 200, 200, 150);
        ///!!!IMPLIMENT PROPER COUNT CONVERTION
        this.gl.drawElements(1 * 6);
    }
}

/**!!!
 * FOR CHARTDRAWER:
 * gl.uniforms.aspect = canvas.width / canvas.height;
 * gl.uniforms.thickness = 5 / canvas.height;
 * 
 */