class GraphDrawer {
    /**
     * Creates an object for drawing graphs.
     * @param {Graph} graph The graph to draw.
     */
    constructor(graph, gl) {
        //#region Properties
        /**The graph to draw.*/
        this.graph = graph;
        /**Visible graph area.*/
        this.area = {
            start: 0,
            end: 1
        };
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
        /**Describes graph transformations.*/
        this.projection = null;
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
        this.baseColor = new AnimationObject(this.color, value, ANIMATION_PERIOD / 2);
        this.redraw = true;
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
        } else if (this.color.a == 0) {
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
        this.visibilityState = !this.visibilityState;
    }

    /**
     * Draws the graph depending on current settings.
     */
    draw(maxY, start, end) {
        //Zoom: 1 / (end - start), (2 - offset) / (top + 1)
        //Translation: (1 - end - start) * zoom, 
        const zoomX = 1 / (this.end - this.start);
        const zoomY = 2 / (maxY + 1);
        const moveX = (1 - this.start - this.end) * zoomX;
        const moveY = zoomY - 1;
        let projection = [
            zoomX, 0, 0,
            0, zoomY, 0,
            moveX, moveY, 1
        ];

        if (this.projection == null) {
            this.projection = new AnimationObject(projection);
        } else {
            this.projection.set(projection, ANIMATION_PERIOD / 2);
        }
        if (this.cuts == null) {
            this.cuts = new AnimationObject([start, end]);
        } else {
            this.cuts.set([start, end], ANIMATION_PERIOD / 2);
        }

        this.gl.stack = this.stack;
        this.gl.uniforms.projection = this.projection.get();
        this.gl.uniforms.color = this.color.toArray();

        start = Math.floor(this.cuts.get()[0]);
        end = Math.ceil(this.cuts.get()[1]);
        //Left additional points off the screen to avoid artifacts
        if (end < this.graph.points.length) end++;
        if (start > 0) start--;

        this.gl.drawElements((end - 1) * 6, start * 6);
        if (!this.baseColor.inProgress && !this.projection.inProgress && !this.cuts.inProgress) {
            this.redraw = false;
        }
    }
}

class ChartDrawer {
    /**
     * Creates an object for drawing charts.
     * @param {Chart} chart The chart to draw.
     */
    constructor(chart, canvas, program, layout = null) {
        //#region Properties
        /**Chart object.*/
        this.chart = chart;
        /**Chart canvas.*/
        this.canvas = canvas;
        /**Layout canvas.*/
        this.layoutCanvas = layout;
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
        this.layoutDrawer = new LayoutDrawer(layout, this.gl);
        /**Whether draw layout or not.*/
        this.layout = !!layout;
        //#endregion

        //Perform initial update
        this.update();

        //Initilizing graph drawers
        for (const graph of chart.graphs) {
            this.graphDrawers.push(new GraphDrawer(graph, this.gl));
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
        this.area.end = percent;
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
    update(backgroundColor, textColor) {
        this.layoutCanvas.width = this.layoutCanvas.clientWidth * window.devicePixelRatio;
        this.layoutCanvas.height = this.layoutCanvas.clientHeight * window.devicePixelRatio;
        this.gl.resize();
        this.gl.uniforms.aspect = this.gl.viewport.width / this.gl.viewport.height;
        this.gl.uniforms.thickness = 5 / this.canvas.height;
        if (backgroundColor) {
            this.gl.background = backgroundColor;
        }
        if (textColor) {
            this.layoutDrawer.color = textColor;
        }
        this.redraw = true;
    }

    /**
     * Calculates chart values for drawing.
     */
    calculate() {
        //Compute values before drawing
        const points = this.graphDrawers[0].graph.points;
        //Estimate index
        let index = Math.round(this.area.start * points.length);
        let previousDistance = Number.MAX_SAFE_INTEGER;
        let goal = this.area.start * 2 - 1;
        //Search for start index
        while (true) {
            const vertex = this.graphDrawers[0].graph.vertices[index];
            const distance = goal - vertex.x;
            if (distance > 0) {
                index++;
            } else if (distance < 0) {
                index--;
            } else {
                break;
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
        let minSelectionDistance = Number.MAX_SAFE_INTEGER;
        let maxY = -Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        //Go forward and scan
        goal = this.area.end * 2 - 1;
        const selection = this.selection * 2 - 1;
        while (true) {
            //Wait for the end
            if (index >= this.graphDrawers[0].graph.vertices.length) {
                break;
            }
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
                if (!drawer.visible) continue;
                const graphVertex = drawer.graph.vertices[index];
                if (graphVertex.y > maxY) {
                    maxY = graphVertex.y;
                } else if (graphVertex.y < minY) {
                    minY = graphVertex.y;
                }
            }
            index++;
        }

        return {
            selection: selectionX,
            top: maxY,
            start: start,
            end: index
        };
    }

    /**
     * Draws all charts.
     */
    draw() {
        const drawingData = this.calculate();

        if (this.layoutDrawer.redraw || this.redraw || this.graphDrawers.some(x => x.redraw)) {
            this.gl.clear();
            if (this.layout) {
                this.drawLayout();
                this.drawSelection(drawingData.selection);
            }
            this.drawGraphs(drawingData.top, drawingData.start, drawingData.end);
        }
        this.redraw = false;
    }

    /**
     * Draws the graphs of the chart.
     */
    drawGraphs(top, start, end) {
        for (const drawer of this.graphDrawers) {
            drawer.draw(top, start, end);
        }
    }

    /**
     * Draws the layout for the chart.
     */
    drawLayout() {
        this.layoutDrawer.draw(this.graphDrawers[0].projection, this.chart);
    }

    /**
     * Draws the selection part of the layout.
     */
    drawSelection(x) {
        if (x != null) {
            this.layoutDrawer.drawSelection(x);
        }
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
        this.color = new Color();
        this.lineFade = new AnimationObject(64);
        this.lineOffset = new AnimationObject(0);
        this.redraw = true;
        //#endregion

        /**Selection stack id*/
        this.selectionStack = this.gl.newStack();

        this.gl.attributes.position = [0, -1, 0, 1];
        this.gl.attributes.direction = [0, 0];

        /**Line stack id*/
        this.linesStack = this.gl.newStack();

        let lines = [];
        let directions = [];
        for (let i = 0; i < this.lineCount; i++) {
            lines.push(-1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1);
            lines.push(1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1);
            directions.push(0);
            directions.push(0);
        }

        let path = new Path(lines);

        this.gl.attributes.position = lines;
        this.gl.attributes.direction = directions;

        console.debug("LayoutDrawer created", this);
    }

    /**
     * Draws the selection line
     * @param {Number} x Date of line coordinate.
     */
    drawSelection(x) {
        const projection = [
            1, 0, 0,
            0, 1, 0,
            x, 0, 1
        ];
        let color = new Color(this.color);
        color.a = 128;

        this.gl.stack = this.selectionStack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = color.toArray();
        this.gl.drawStrip(2);
    }

    /**
     * Draws the layout.
     * @param {Object} bounds Graph drawer current bounds.
     */
    draw(projection, chart) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawLines(projection, chart);
        /*
        this.context.fillStyle = this.textColor;
        this.context.font = (bottom / 2) + "px " +
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"];

        this.drawDates(bounds, maxBounds, bottom);*/
        if (!this.lineFade.inProgress && !this.lineOffset.inProgress) {
            this.redraw = false;
        }
    }

    /**
     * Draws layout lines.
     * @param {Object} bounds Graph drawer current bounds.
     */
    drawLines(graphProjection, chart) {
        const move = graphProjection ? graphProjection.get()[7] : 0;
        const scale = graphProjection ? graphProjection.get()[4] : 1;
        const projection = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
        let color = new Color(this.color);
        color.a = 192;

        this.gl.stack = this.linesStack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = color.toArray();
        this.gl.drawStrip(2);

        projection[7] = move % (2 / this.lineCount);
        if (projection[7] > (move % (1 / this.lineCount))) {
            this.lineFade.set(0, ANIMATION_PERIOD * 2);
            this.redraw = true;
        } else {
            this.lineFade.set(64, ANIMATION_PERIOD * 2);
            this.redraw = true;
        }
        projection[7] -= (this.lineFade.get() / 64) / this.lineCount;

        color.a = this.lineFade.get();
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = color.toArray();
        this.gl.drawStrip(this.lineCount * 2, 1);
        
        const graphValue = chart.size.y / scale;
        this.drawValues(projection[7], color, graphValue);

        color.a = 64 - this.lineFade.get();
        projection[7] -= 1 / this.lineCount;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = color.toArray();
        this.gl.drawStrip(this.lineCount * 2, 1);
        this.drawValues(projection[7], color, graphValue);
    }

    drawValues(y, color, graphValue) {
        let textColor = new Color(color);
        textColor.a *= 2;
        y *= this.gl.canvas.height / 2;
        y += 3 * window.devicePixelRatio;

        this.context.fillStyle = textColor.toString();
        this.context.font = (this.gl.canvas.height / this.lineCount / 4) + "px " +
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"]; ///HARDCODDED PROPERTY!
            
        ///SIMPLIFY EQUATIONS!
        for (let i = 1; i < this.lineCount; i++) {
            const textY = - y + (i * this.gl.canvas.height / this.lineCount);
            if (textY > this.gl.canvas.height) continue;
            let label = (this.gl.canvas.height - textY) / this.gl.canvas.height * graphValue;
            //Format value
            if (Math.abs(label) > 1000000000) label = (label / 1000000000).toFixed(2) + "B";
            else if (Math.abs(label) > 1000000) label = (label / 1000000).toFixed(2) + "M";
            else if (Math.abs(label) > 1000) label = (label / 1000).toFixed(1) + "K";
        
            this.context.fillText(label, 0, textY);
        }
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
}