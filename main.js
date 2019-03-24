console.debugging = true; ///DEBUG!

//#region Main
loadData("chart_data.json", (source) => {
    let drawer, preview;
    let canvas = document.getElementById("chart");
    let previewCanvas = document.getElementById("preview");
    let charts = Chart.array(source);
    let chartId = 0;

    //Get elements
    let selector = document.getElementById("select"),
        leftDragger = document.getElementById("left-dragger"),
        rightDragger = document.getElementById("right-dragger"),
        coverLeft = document.getElementById("cover-left"),
        coverRight = document.getElementById("cover-right");

    loadChart(chartId);
    moibleStyle();

    //Create controller
    let controller = new ChartController(selector, leftDragger, rightDragger, canvas);
    controller.onupdate = (start, end) => {
        coverLeft.style.width = start + "%";
        coverRight.style.width = (100 - end) + "%";
        drawer.start = start;
        drawer.end = end;
    };
    controller.onselect = (x, value, visible) => {
        drawer.select = visible ? value : undefined;
        let tooltip = document.getElementById("tooltip");
        tooltip.style.left = (x - tooltip.clientWidth / 3) + "px";
        tooltip.style.opacity = visible ? "1" : "0";

        if (visible) {
            let date = new Date(+drawer.selection.date).toString();
            date = date.split(" ")[0] + ", " + date.split(" ")[1] + " " + date.split(" ")[2];
            document.getElementById("date").innerHTML = date;
            let values = document.getElementById("values").children;
            for (let i = 0; i < values.length; i++) {
                values[i].style.display = drawer.graphDrawers[i].visible ? "block" : "none";
                values[i].children[0].innerHTML = drawer.selection.values[i];
            }
        }
    };
    controller.update();

    previewCanvas.width = previewCanvas.clientWidth * 2;
    previewCanvas.height = previewCanvas.clientHeight * 2;
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;
    preview.draw();

    document.getElementsByClassName("title")[0].onclick = () => {
        chartId = (chartId + 1) % charts.length;
        loadChart(chartId);
        controller.update();
        previewCanvas.width = previewCanvas.clientWidth * 2;
        previewCanvas.height = previewCanvas.clientHeight * 2;
        preview.draw();
    };

    window.onresize = () => {
        selector.style.left = "0px";
        selector.style.width = "0px";
        previewCanvas.width = previewCanvas.clientWidth * 2;
        previewCanvas.height = previewCanvas.clientHeight * 2;
        canvas.width = canvas.clientWidth * 2;
        canvas.height = canvas.clientHeight * 2;
        preview.draw();
        controller.update();
    };

    document.getElementsByClassName("theme-switch")[0].onclick = () => {
        setTimeout(render, 1);
        setTimeout(moibleStyle, 2);
    };

    function render() {
        drawer.draw();
        preview.draw();
        requestAnimationFrame(render);
    }

    function loadChart(id) {
        let chart = charts[id];

        //Create chart drawers
        drawer = new ChartDrawer(chart, canvas, {
            left: 0,
            bottom: 48
        });
        preview = new ChartDrawer(chart, previewCanvas);
        preview.layout = false;
        preview.lineWidth = 2;
        drawer.lineWidth = 5;

        //Update chart title
        document.getElementsByClassName("title")[0].innerHTML = "Chart #" + (id + 1);
        //Update chart buttons
        let graphs = document.getElementsByClassName("graphs")[0];
        graphs.innerHTML = "";
        document.getElementById("values").innerHTML = "";
        for (const graphId in chart.graphs) {
            let button = document.createElement("label");
            let checkbox = document.createElement("input");
            let icon = document.createElement("div");
            let name = document.createTextNode(chart.graphs[+graphId].name);
            let tooltip = document.createElement("div");
            let tooltipValue = document.createElement("div");
            let tooltipName = document.createElement("div");

            button.className = "button";
            checkbox.type = "checkbox";
            checkbox.checked = true;
            icon.className = "icon";
            tooltip.className = "graph-value";
            tooltipValue.className = "value";
            tooltipName.className = "name";
            tooltipName.innerHTML = chart.graphs[+graphId].name;
            tooltip.style.color = chart.graphs[+graphId].color;
            icon.style.backgroundColor = chart.graphs[+graphId].color;

            button.appendChild(checkbox);
            button.appendChild(icon);
            button.appendChild(name);
            graphs.appendChild(button);
            tooltip.appendChild(tooltipValue);
            tooltip.appendChild(tooltipName);
            document.getElementById("values").appendChild(tooltip);

            button.onclick = (e) => {
                let visibleGraphs = drawer.graphDrawers.reduce((n, x) => {
                    return n + (x.visible ? 1 : 0);
                }, 0);

                if (drawer.graphDrawers[+graphId].visible && visibleGraphs == 1) {
                    return false;
                }

                drawer.toggle(+graphId, checkbox.checked);
                preview.toggle(+graphId, checkbox.checked);
            }
        }
    }

    function moibleStyle() {
        document.body.style.backgroundColor =
            window.getComputedStyle(document.getElementsByClassName("page")[0])["background-color"];
        ///CODE BELLOW DOES NOT WORK!
        if (document.getElementById("theme-checkbox").checked)
            document.getElementById("bar").content = "default";
        else
            document.getElementById("bar").content = "black-translucent";
    }

    render();
});
//#endregion

//#region Classes
class Chart {
    /**
     * Creates a chart object.
     * @param {Object} source Source JSON string, object or filename to create a chart.
     */
    constructor(source) {
        //#region Properties
        /**Whether the chart is loaded or not.*/
        this.ready = false;
        /**Returns the contained graph objects.*/
        this.graphs = [];
        //#endregion

        //#region Parse source
        //Check the source type
        if (typeof source === "string") {
            //Try to parse from json string
            try {
                source = JSON.parse(source);
            } catch {
                throw new Error("Source is not a valid JSON object!");
            }
        }

        if (Array.isArray(source)) {
            throw new Error("Array is not allowed! Use \"Chart.array\" instead.");
        }

        if (!(
                typeof source === "object" &&
                typeof source.colors === "object" &&
                typeof source.columns === "object" &&
                typeof source.names === "object" &&
                typeof source.types === "object"
            )) {
            throw new Error("Wrong source format!");
        }
        //#endregion

        console.debug("Chart created", this);
        this._initialize(source);
    }

    /**
     * Builds the object using the loaded source.
     * @param {Object} source Source fot the chart.
     */
    _initialize(source) {
        console.debug("Source parsed", source);

        //Define z axis
        const xType = Object.keys(source.types).find(x => source.types[x] == "x");
        let xValues = source.columns.find(x => x[0] == xType);
        xValues.shift();

        for (const graph in source.names) {
            //Parse color
            let color = source.colors[graph];
            //Parse name
            let name = source.names[graph];
            //Parse columns of each graph
            let values = {};

            let yValues = source.columns.find(x => x[0] == graph);
            yValues.shift();
            xValues.forEach((x, i) => {
                values[x] = yValues[i];
            });

            //Create a graph
            this.graphs.push(
                new Graph(values, color, name)
            );
        }

        this.ready = true;
        console.debug("Chart initialized", this);
    }

    /**
     * Returns an array of chart objects.
     * @param {Array} source Source JSON string, array or filename to create charts.
     * @returns {Chart[]} An array of chart objects.
     */
    static array(source) {
        //#region Parse source
        //Check the source type
        if (typeof source === "string") {
            //Try to parse from json string
            try {
                source = JSON.parse(source);
            } catch {
                throw new Error("Source is not a valid JSON object!");
            }
        }

        if (!Array.isArray(source)) {
            throw new Error("Source is not an array! Use \"new Chart\" if it is a chart source.");
        }
        //#endregion

        let charts = [];
        for (const chart of source) {
            charts.push(new Chart(chart));
        }
        console.debug("Charts array parsed", charts);
        return charts;
    }
}

class Graph {
    /**
     * Creates a graph object.
     * @param {Object} source Source object to create a graph.
     */
    constructor(values, color, name) {
        //#region Properties
        /**Graph x and y values.*/
        this.values = values;
        /**Graph color.*/
        this.color = color;
        /**Graph name.*/
        this.name = name;
        //#endregion
        console.debug("Graph created", this);
    }
}

class GraphDrawer {
    /**
     * Creates an object for drawing graphs.
     * @param {Graph} graph The graph to draw.
     */
    constructor(graph, canvas, offsets = {
        left: 0,
        bottom: 0
    }) {
        //#region Properties
        /**The graph to draw.*/
        this.graph = graph;
        /**Maximum drawing bounds.*/
        this.maxBounds = new Bounds(
            +Object.keys(graph.values)[0],
            +Object.keys(graph.values)[Object.keys(graph.values).length - 1],
            +Math.max.apply(Math, Object.values(graph.values)),
            Math.min(0, +Math.min.apply(Math, Object.values(graph.values)))
        );
        /**Current drawing bound.*/
        this.bounds = this.maxBounds.clone();
        /**Graph offsets (used to create space for the legend)*/
        this.offsets = offsets;
        /**Drawing canvas.*/
        this.canvas = canvas
        /**Whether the graph is visible or not.*/
        this._visible = 1;
        /**Drawing context.*/
        this.context = canvas.getContext("2d");
        //#endregion

        console.debug("GraphDrawer created", this);
    }

    /**
     * Visible property. Can be AnimationObject.
     */
    set visible(value) {
        if (value === true) value = 1;
        if (value === false) value = 0;

        this._visible = value;
    }

    /**
     * Visible property. Can be AnimationObject.
     */
    get visible() {
        if (this._visible instanceof AnimationObject) {
            return !(this._visible.get() == 0);
        } else {
            return !(this._visible == 0);
        }
    }

    /**
     * Visibility value from 0 to 1.
     */
    get visibility() {
        if (this._visible instanceof AnimationObject) {
            return this._visible.get();
        } else {
            return this._visible ? 1 : 0;
        }
    }

    /**
     * Returns size of viewing area.
     */
    get view() {
        return {
            width: +this.canvas.width - this.offsets.left,
            height: +this.canvas.height - this.offsets.bottom
        };
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
    draw(selection, lineWidth = 2.5) {
        if (!this.visible) return;
        //Set color
        this.context.strokeStyle = this.graph.color;
        this.context.lineWidth = lineWidth;
        let widthRatio = this.view.width / (this.maxBounds.right - this.maxBounds.left);
        let heightRatio = this.view.height / (this.bounds.top - this.bounds.bottom);
        widthRatio *= (this.maxBounds.right - this.maxBounds.left) / (this.bounds.right - this.bounds.left);
        //Start drawing
        this.context.beginPath();
        let firstPoint, previousPoint;

        for (const x in this.graph.values) {
            const y = this.graph.values[x];

            if (x < this.bounds.left || y < this.bounds.bottom) {
                firstPoint = x;
                continue;
            }

            if (firstPoint != null) {
                const y0 = this.graph.values[firstPoint];

                let dx0 = (firstPoint - this.bounds.left) * widthRatio + this.offsets.left;
                let dy0 = (y0 - this.bounds.bottom) * heightRatio;

                this.context.moveTo(dx0, this.view.height - dy0);

                firstPoint = null;
            }

            let dx = (x - this.bounds.left) * widthRatio + this.offsets.left;
            let dy = (y - this.bounds.bottom) * heightRatio;

            this.context.lineTo(dx, this.view.height - dy);

            if (previousPoint == selection) {
                this.context.globalAlpha = this.visibility;
                this.context.stroke();

                this.context.fillStyle = "rgb(" +
                    window.getComputedStyle(document.getElementsByClassName("page")[0])
                    .getPropertyValue("--color-background").trim() + ")";;
                this.context.beginPath();
                const dx0 = (previousPoint - this.bounds.left) * widthRatio + this.offsets.left;
                const dy0 = (this.graph.values[previousPoint] - this.bounds.bottom) * heightRatio;
                this.context.arc(dx0, this.view.height - dy0, this.view.height / 50, 0, 2 * Math.PI);
                this.context.fill();
                this.context.stroke();
                this.context.globalAlpha = 1;

                this.context.beginPath();
                this.context.moveTo(dx, this.view.height - dy);
            }

            previousPoint = x;
            if (x > this.bounds.right)
                break;
        }

        this.context.globalAlpha = this.visibility;
        this.context.stroke();
        this.context.globalAlpha = 1;
    }
}

class LayoutDrawer {
    /**
     * Creates an object for drawing a layout.
     * @param {Element} canvas The canvas for drawing layout.
     */
    constructor(canvas) {
        //#region Properties
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        /**Amount of line to draw.*/
        this.lineCount = 6;
        this.dateCount = 7;
        this.dateScale = 4;
        this.lineColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.25)";
        this.textColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.5)";
        //#endregion

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
    drawLines(bounds, maxBounds, bottom) {
        const top = maxBounds.top - bounds.top;
        const size = (bounds.top - bounds.bottom);
        const maxSize = (maxBounds.top - maxBounds.bottom);
        const zoom = size / maxSize;
        const ratio = size / (this.view.height - bottom);

        const spacing = (this.view.height - bottom) / this.lineCount;
        const margin = 6;
        const area = (bounds.top - bounds.bottom) / this.lineCount;

        this.context.strokeStyle = this.textColor;
        this.context.fillStyle = this.textColor;
        this.context.lineWidth = 1;
        this.context.font = (spacing / 4) + "px " +
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"];

        const offset = ((top * zoom) % area) / ratio;
        bottom += this.context.lineWidth;
        for (let i = 0; i < this.lineCount; i++) {
            let y = this.view.height - bottom - spacing * i;
            if (i != 0)
                y -= offset;

            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(this.view.width, y);
            this.context.stroke();

            let label = Math.round((this.view.height - y - bottom) * ratio);
            this.context.fillText(label, 0, y - margin);
            if (i == 0)
                this.context.strokeStyle = this.lineColor;
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

    /**
     * Draws the selection line
     * @param {Number} x Date of line coordinate.
     * @param {Object} bounds Graph drawer current bounds.
     * @param {Number} bottom Margin from the bottom (for dates).
     */
    drawSelection(date, bounds, bottom) {
        const size = (bounds.right - bounds.left);
        const ratio = size / this.view.width;
        let x = (date - bounds.left) / ratio;

        this.context.strokeStyle = this.textColor;
        this.context.lineWidth = 1;

        this.context.beginPath();
        this.context.moveTo(x, 0);
        this.context.lineTo(x, this.view.height - bottom);
        this.context.stroke();
    }
}

class ChartDrawer {
    /**
     * Creates an object for drawing charts.
     * @param {Chart} chart The chart to draw.
     */
    constructor(chart, canvas, offsets = {
        left: 0,
        bottom: 0
    }) {
        //#region Properties
        /**Graph drawer objects.*/
        this.graphDrawers = [];
        /**Layout drawer object.*/
        this.layoutDrawer = new LayoutDrawer(canvas);
        /**The maximum drawing size.*/
        this.size = 0;
        /**The minimal left bound.*/
        this.minLeft = Number.MAX_SAFE_INTEGER;
        /**The maximum right bound.*/
        this.maxRight = -Number.MAX_SAFE_INTEGER;
        /**Whether adjust drawing height automaticaly depending on maximum point or not.*/
        this.autoHeight = true;
        /**Whether draw layout or not.*/
        this.layout = true;
        /**Clear function.*/
        this.clear = () => {};
        /**The width of graph line to draw.*/
        this.lineWidth = 2.5;
        /**The user defined offsets.*/
        this.offsets = offsets;
        /**The selection.*/
        this.selection = {
            date: null,
            values: []
        };
        //#endregion

        //Initilizing graph drawers
        for (const graph of chart.graphs) {
            let drawer = new GraphDrawer(graph, canvas, offsets);

            //Define the smallest left bound
            if (drawer.maxBounds.left < this.minLeft) {
                this.minLeft = drawer.maxBounds.left;
            }
            //Define the smallset right bound
            if (drawer.maxBounds.right > this.maxRight) {
                this.maxRight = drawer.maxBounds.right;
            }
            //Save a drawer
            this.graphDrawers.push(drawer);
        }

        //Calculate the maximum size
        this.size = this.maxRight - this.minLeft;

        this.clear = () => {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        };

        console.debug("ChartDrawer created", this);
    }

    /**
     * Sets the start drawing point.
     * @param {Number} percent The percentage of drawing start point.
     */
    set start(percent) {
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;

        let left = this.minLeft + (this.size / 100 * percent);

        //Setup left bounds and calculate max points
        for (const drawer of this.graphDrawers) {
            drawer.bounds.left = left;
        }

        this.updateHeight();
    }

    /**
     * Sets the end drawing point.
     * @param {Number} percent The percentage of drawing end point.
     */
    set end(percent) {
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;

        let right = this.maxRight - (this.size / 100 * (100 - percent));

        //Setup right bounds and calculate max points
        for (const drawer of this.graphDrawers) {
            drawer.bounds.right = right;
        }

        this.updateHeight();
    }

    /**
     * Sets the postion of selection line.
     * @param {Number} percent The percentage of selected point.
     */
    set select(percent) {
        if (percent == undefined) {
            this.selection.date = null;
        }
        if (this.graph != undefined) {
            const visibleGraph = this.graph;
            const size = visibleGraph.bounds.right - visibleGraph.bounds.left;
            const position = visibleGraph.bounds.left + (size * percent);

            this.selection.values = [];
            for (const drawer of this.graphDrawers) {
                if (!drawer.visible) {
                    this.selection.values.push(undefined);
                    continue;
                }

                let value = Number.MAX_SAFE_INTEGER;
                for (const x in drawer.graph.values) {
                    if (Math.abs(x - position) < value) {
                        value = Math.abs(x - position);
                        this.selection.date = x;
                    }
                }
                this.selection.values.push(drawer.graph.values[this.selection.date]);
            }
        }
    }

    /**
     * Returns the first visible graph.
     */
    get graph() {
        return this.graphDrawers.find(x => x.visible)
    }

    /**
     * Toggles or sets graph's visibility state by id.
     * @param {Number} id Graph id.
     * @param {Boolean} state Visibility state.
     */
    toggle(id, state = undefined) {
        if (state == undefined) {
            state = (!this.graphDrawers[id].visible);
        }
        this.graphDrawers[id].visible = state ?
            new AnimationObject(this.graphDrawers[id].visible, 1, 200) :
            new AnimationObject(this.graphDrawers[id].visible, 0, 200);

        setTimeout(() => {
            this.updateHeight(state);
        }, 1);
    }

    /**
     * Updates viewport height.
     */
    updateHeight(state = false) {
        let top = -Number.MAX_SAFE_INTEGER;

        //Calculate max points
        for (const drawer of this.graphDrawers) {
            if (drawer.visibility != 1 && !state) continue;
            if (drawer.visibility == 0 && state) continue;

            if (this.autoHeight) {
                let maximum = drawer.localMaximum;
                if (maximum > top)
                    top = maximum;
            } else if (drawer.maxBounds.top > top) {
                top = drawer.maxBounds.top;
            }
        }

        //Setup top bounds
        for (const drawer of this.graphDrawers) {
            drawer.bounds.top = new AnimationObject(drawer.bounds.top, top, 200);
        }
    }

    /**
     * Draws all charts.
     */
    draw() {
        this.clear();
        if (this.layout) this.drawSelection();
        this.drawGraphs();
        if (this.layout) this.drawLayout();
    }

    /**
     * Draws the graphs of the chart.
     */
    drawGraphs() {
        for (const drawer of this.graphDrawers) {
            drawer.draw(this.selection.date, this.lineWidth);
        }
    }

    /**
     * Draws the layout for the chart.
     */
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
     */
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
    }
}

class ChartController {
    /**
     * Creates an interactive chart controller.
     * @param {Element} selector Chart area selector element.
     * @param {Element} leftDragger Area left side dragger element.
     * @param {Element} rightDragger Area right side dragger element.
     * @param {Function} onupdate Callback on controller's update.
     */
    constructor(selector, leftDragger, rightDragger, field) {
        //#region Properties
        /**Chart area selector element.*/
        this.selector = selector;
        /**Chart drawing element.*/
        this.field = field;
        /**Border width style of the selector element.*/
        this.borderWidth = parseInt(window.getComputedStyle(selector)["border-left-width"]) * 2;
        /**Minimum width style of the selector element.*/
        this.minWidth =
            parseInt(window.getComputedStyle(selector)["min-width"]) + this.borderWidth;

        /**Old element position for dragging.*/
        this.positionOld = 0;
        /**New element position for dragging.*/
        this.positionNew = 0;
        /**Callback on controller's update.*/
        this.onupdate = () => {};
        /**Callback on changed field selection.*/
        this.onselect = () => {};
        //#endregion
        //#region Events Registration
        leftDragger.onmousedown = (e) => {
            this.startDrag(e, 1)
        };
        leftDragger.ontouchstart = (e) => {
            this.startDrag(e, 1)
        };
        rightDragger.onmousedown = (e) => {
            this.startDrag(e, 2)
        };
        rightDragger.ontouchstart = (e) => {
            this.startDrag(e, 2)
        };
        selector.onmousedown = (e) => {
            this.startDrag(e, 0)
        };
        selector.ontouchstart = (e) => {
            this.startDrag(e, 0)
        };
        field.onmousemove = (e) => {
            this.select(e, true);
        };
        field.onmouseleave = (e) => {
            this.select(e, false);
        };
        field.ontouchstart = (e) => {
            this.select(e, true);
        };
        field.ontouchmove = (e) => {
            this.select(e, true);
        };
        field.ontouchend = (e) => {
            this.select(e, false);
        };
        //#endregion

        console.debug("ChartController created", this);
    }

    /**
     * Updates current selection state and invokes callback.
     * @param {Object} eventArgs Event arguments.
     * @param {Bool} visible Whethe selection is visible now or not.
     */
    select(eventArgs, visible) {
        if (!eventArgs.clientX && eventArgs.touches && eventArgs.touches.length > 0) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();
        let percent = (eventArgs.clientX - this.field.offsetLeft) /
            this.field.clientWidth;

        this.onselect(eventArgs.clientX, percent, visible);
    }

    /**
     * Starts element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {Number} type Type of dragging (0-2).
     */
    startDrag(eventArgs, type) {
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.stopPropagation();
        eventArgs.preventDefault();

        //Save the old postion and register the events
        this.positionOld = eventArgs.clientX;
        document.onmouseup = (e) => {
            this.stopDrag()
        };
        document.ontouchend = (e) => {
            this.stopDrag()
        };
        document.onmousemove = (e) => {
            this.drag(e, type)
        };
        document.ontouchmove = (e) => {
            this.drag(e, type)
        };

        console.debug("Dragging started.");
    }

    /**
     * Performs element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {Number} type Type of dragging (0-2).
     */
    drag(eventArgs, type) {
        console.debug("Dragging...")
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();

        //Calculate the new position
        this.positionNew = this.positionOld - eventArgs.clientX;
        this.positionOld = eventArgs.clientX;

        //Set the style
        if (type === 0) {
            let left = this.selector.offsetLeft - this.positionNew;
            if (left < 0) left = 0;

            this.selector.style.left = left + "px";
        } else if (type === 1) {
            let width = this.selector.clientWidth + this.positionNew;
            let left = this.selector.offsetLeft - this.positionNew;

            if (width < this.minWidth) {
                left += width - this.minWidth;
                width = this.minWidth;
            }
            if (left < 0) {
                width -= -left;
                left = 0;
            }

            this.selector.style.left = left + "px";
            this.selector.style.width = width + "px";
        } else if (type === 2) {
            let width = this.selector.clientWidth - this.positionNew;
            if (width + this.selector.offsetLeft + this.borderWidth >
                this.selector.parentNode.clientWidth) {
                width = this.selector.clientWidth;
            }

            this.selector.style.width = width + "px";
        }

        this.normalize();
        this.update();
    }

    /**
     * Stops element dragging.
     */
    stopDrag() {
        //Clear the events
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;

        console.debug("Dragging stopped.");
    }

    /**
     * Makes sure that the element is inside boudary box if not normalizes.
     */
    normalize() {
        if (parseInt(this.selector.style.left) < 0) {
            this.selector.style.left = "0px";
        }
        if ((parseInt(this.selector.style.left) +
                this.selector.clientWidth + this.borderWidth) >
            this.selector.parentNode.clientWidth) {
            this.selector.style.left = (this.selector.parentNode.clientWidth -
                this.selector.clientWidth - this.borderWidth) + "px";
        }
    }

    /**
     * Updates current state of the controller and invokes callback.
     */
    update() {
        let size = this.selector.parentNode.clientWidth;
        let start = this.selector.offsetLeft / (size / 100);
        let end = (this.selector.offsetLeft +
            this.selector.clientWidth + this.borderWidth) / (size / 100);

        this.onupdate(start, end);
    }

    get dragging() {
        return !(document.onmouseup == null && document.ontouchend == null &&
            document.onmousemove == null && document.ontouchmove == null);
    }
}

class AnimationObject {
    /**
     * Creates an object for animating properties.
     * @param {Number} startProperty Property value at the start of the animation.
     * @param {Number} endProperty Property value at the end of the animation.
     * @param {Number} duration How long the animation will be in milliseconds.
     */
    constructor(startProperty, endProperty = startProperty, duration = 0) {
        this.startTime = Date.now();
        this.duration = duration;
        this.startProperty = startProperty;
        this.endProperty = endProperty;
    }

    /**
     * Returns the property value based on the past time.
     */
    get() {
        let timePast = Date.now() - this.startTime;
        if (timePast > this.duration) return this.endProperty;

        return this.startProperty + ((timePast / this.duration) * (this.endProperty - this.startProperty));
    }
}

class Bounds {
    /**
     * Creates an object for storing bounds data. 
     * Aslo supports AnimationObject as values.
     * @param {Number} left Left bound.
     * @param {Number} right Right bound.
     * @param {Number} top Top bound.
     * @param {Number} bottom Bottom bound.
     */
    constructor(left, right, top, bottom) {
        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;
    }

    /**Left bound.*/
    get left() {
        if (this._left instanceof AnimationObject) {
            return this._left.get();
        } else {
            return this._left;
        }
    }

    /**Left bound.*/
    set left(value) {
        this._left = value;
    }

    /**Right bound.*/
    get right() {
        if (this._right instanceof AnimationObject) {
            return this._right.get();
        } else {
            return this._right;
        }
    }

    /**Right bound.*/
    set right(value) {
        this._right = value;
    }

    /**Top bound.*/
    get top() {
        if (this._top instanceof AnimationObject) {
            return this._top.get();
        } else {
            return this._top;
        }
    }

    /**Top bound.*/
    set top(value) {
        this._top = value;
    }

    /**Bottom bound.*/
    get bottom() {
        if (this._bottom instanceof AnimationObject) {
            return this._bottom.get();
        } else {
            return this._bottom;
        }
    }

    /**Bottom bound.*/
    set bottom(value) {
        this._bottom = value;
    }

    /**Returns the cloned object*/
    clone() {
        return new Bounds(this.left, this.right, this.top, this.bottom);
    }
}
//#endregion

//#region Miscellaneous 
//Active pseudo-class mobile compatibility
document.addEventListener("touchstart", function () {}, true);

//Custom debugging output
console.debug = function () {
    if (!console.debugging) return;
    console.log.apply(this, arguments);
};

/**
 * Handful function for loading JSON data from url.
 * @param {String} url URL adress of JSON file.
 * @param {Function} callback Callback function.
 */
function loadData(url, callback) {
    let requestObject = new XMLHttpRequest();
    requestObject.overrideMimeType("application/json");
    requestObject.responseType = "json";
    requestObject.open("GET", url, true);
    requestObject.onreadystatechange = () => {
        if (requestObject.readyState == 4 && requestObject.status == "200") {
            callback(requestObject.response);
        }
    };
    requestObject.send();
}
//#endregion