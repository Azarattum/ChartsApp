console.debugging = true; ///DEBUG!

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
        render();
    };
    controller.onstop = () => {
        render();
    };
    controller.onselect = (x, value, visible) => {
        drawer.select = visible? value : undefined;
        let tooltip = document.getElementById("tooltip");
        tooltip.style.left = (x - tooltip.clientWidth / 3) + "px";
        tooltip.style.opacity = visible? "1" : "0";

        if (visible) {
            let date = new Date(+drawer.selection.date).toString();
            date = date.split(" ")[0] + ", " + date.split(" ")[1] + " " + date.split(" ")[2];
            document.getElementById("date").innerHTML = date;
            let values = document.getElementById("values").children;
            for (let i = 0; i < values.length; i++) {
                values[i].style.display = drawer.graphDrawers[i].visible? "block" : "none";
                values[i].children[0].innerHTML = drawer.selection.values[i];
            }
        }
        render();
    };
    controller.update();

    previewCanvas.width = previewCanvas.clientWidth * 2;
    previewCanvas.height = previewCanvas.clientHeight * 2;
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
        preview.draw();
        controller.update();
        render();
    };

    document.getElementsByClassName("theme-switch")[0].onclick = () => {
        setTimeout(render, 1);
        setTimeout(moibleStyle, 2);
    };

    function render() {
        canvas.width = canvas.clientWidth * 2;
        canvas.height = canvas.clientHeight * 2;
        drawer.draw(controller.dragging);
    }

    function loadChart(id) {
        let chart = charts[id];

        //Create chart drawers
        drawer = new AnimatedChartDrawer(chart, canvas, {
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
            tooltipValue.innerHTML = 42; ///TEST
            tooltip.style.color = chart.graphs[+graphId].color;
            icon.style.backgroundColor = chart.graphs[+graphId].color;

            button.appendChild(checkbox);
            button.appendChild(icon);
            button.appendChild(name);
            graphs.appendChild(button);
            tooltip.appendChild(tooltipValue);
            tooltip.appendChild(tooltipName);
            document.getElementById("values").appendChild(tooltip);

            button.onclick = () => {
                drawer.toggle(+graphId, checkbox.checked);
                preview.toggle(+graphId, checkbox.checked);
                render();
                previewCanvas.width = previewCanvas.clientWidth * 2;
                previewCanvas.height = previewCanvas.clientHeight * 2;
                preview.draw();
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
});

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
        /**Fires after the chart loaded and processed all data.*/
        this.onload = () => {};
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
        this.onload();
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
        this.maxBounds = {
            left: +Object.keys(graph.values)[0],
            right: +Object.keys(graph.values)[Object.keys(graph.values).length - 1],
            top: +Math.max.apply(Math, Object.values(graph.values)),
            bottom: Math.min(0, +Math.min.apply(Math, Object.values(graph.values)))
        }
        /**Current drawing bound.*/
        this.bounds = Object.assign({}, this.maxBounds);
        /**Graph offsets (used to create space for the legend)*/
        this.offsets = offsets;
        /**Drawing canvas.*/
        this.canvas = canvas
        /**Whether the graph is visible or not.*/
        this.visible = true;
        /**Drawing context.*/
        this.context = canvas.getContext("2d");
        //#endregion

        console.debug("GraphDrawer created", this);
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
    draw(lineWidth = 2.5) {
        if (!this.visible) return;
        //Set color
        this.context.strokeStyle = this.graph.color;
        this.context.lineWidth = lineWidth;
        let widthRatio = this.view.width / (this.maxBounds.right - this.maxBounds.left);
        let heightRatio = this.view.height / (this.bounds.top - this.bounds.bottom);
        widthRatio *= (this.maxBounds.right - this.maxBounds.left) / (this.bounds.right - this.bounds.left);
        //Start drawing
        this.context.beginPath();
        let firstPoint;

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
            //console.debug("Draw to", dx, dy); ///DEBUG!

            if (x > this.bounds.right)
                break;
        }

        this.context.stroke();
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
    draw(bounds, maxBounds, bottom, selection) {
        //Update colors
        this.lineColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.25)";
        this.textColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.5)";

        this.drawLines(bounds, bottom);
        if (selection != null) {
            this.drawSelection(selection, bounds, bottom);
        }

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
    drawLines(bounds, bottom) {
        let spacing = this.view.height / this.lineCount;
        let margin = 6;
        let area = (bounds.top - bounds.bottom) / this.lineCount;

        this.context.strokeStyle = this.textColor;
        this.context.fillStyle = this.textColor;
        this.context.lineWidth = 1;
        this.context.font = (spacing / 4) + "px " +
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"];

        bottom += this.context.lineWidth;
        for (let i = 0; i < this.lineCount; i++) {
            let y = this.view.height - bottom - spacing * i;
            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(this.view.width, y);
            this.context.stroke();

            let label = Math.round(bounds.bottom + area * i);
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
                        //Important: date moving
                        x += spacing * (this.dateCount / s);
                    }
                }
            }

            while (x / scale < (-bottom * 3)) {
                x += spacing * (this.dateCount * scale * 2);
            }

            x /= zoom;

            this.drawDate(bounds, ratio, margin, x);
        }
        console.debug("Scale: ", scale);
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
        console.debug(x);

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
        this.selection = {date: null, values: []};
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
            this.graphDrawers[id].visible = !this.graphDrawers[id].visible;
        } else {
            this.graphDrawers[id].visible = state;
        }

        this.updateHeight();
    }

    /**
     * Updates viewport height.
     */
    updateHeight() {
        let top = -Number.MAX_SAFE_INTEGER;

        //Calculate max points
        for (const drawer of this.graphDrawers) {
            if (!drawer.visible) continue;

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
            if (!drawer.visible) continue;
            drawer.bounds.top = top;
        }
    }

    /**
     * Draws all charts.
     */
    draw() {
        this.clear();
        this.drawGraphs();
        if (this.layout) this.drawLayout();
    }

    /**
     * Draws selction line;
     * @param {Number} percent The percentage of selected point.
     */
    drawSelection(percent) {

    }

    /**
     * Draws the graphs of the chart.
     */
    drawGraphs() {
        for (const drawer of this.graphDrawers) {
            drawer.draw(this.lineWidth);
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
                this.offsets.bottom,
                this.selection.date
            );
        }
    }
}

class AnimatedChartDrawer extends ChartDrawer {
    constructor(chart, canvas, offsets = {
        left: 0,
        bottom: 0
    }) {
        super(chart, canvas, offsets);
        //#region Properties
        this.topEnd = null;
        this.animationDuration = 200;
        this.animation;
        //#endregion
    }

    /**
     * Draws all charts.
     */
    draw(preventAnimation = false) {
        console.debug("Dragging:", preventAnimation);
        if (this.topEnd == null || preventAnimation) {
            super.draw();
            return;
        }

        let interval = 25;
        let steps = Math.ceil(this.animationDuration / interval);
        let i = 0;
        super.draw();
        clearInterval(this.animation);
        this.animation = setInterval(() => {
            //Setup top bounds
            for (const drawer of this.graphDrawers) {
                if (!drawer.visible) continue;
                let step = (this.topEnd - drawer.topStart) / steps;
                drawer.bounds.top += step;
                if (i >= steps) {
                    drawer.bounds.top = this.topEnd;
                }
            }
            //Draw the result
            super.draw();

            if (i >= steps) {
                clearInterval(this.animation);
                this.topEnd = null;
                this.topStart = null;
            } else {
                i++;
            }
        }, interval);
    }

    /**
     * Updates viewport height.
     */
    updateHeight() {
        let top = -Number.MAX_SAFE_INTEGER;

        //Calculate max points
        for (const drawer of this.graphDrawers) {
            if (!drawer.visible) continue;

            if (this.autoHeight) {
                let maximum = drawer.localMaximum;
                if (maximum > top)
                    top = maximum;
            } else if (drawer.maxBounds.top > top) {
                top = drawer.maxBounds.top;
            }

            drawer.topStart = drawer.bounds.top;
        }

        //Save top bounds
        console.debug("Goal:", top);
        this.topEnd = top;
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
        /**Callback on controller's stop.*/
        this.onstop = () => {};
        //#endregion
        //#region Events Registration
        leftDragger.onmousedown = (e) => {
            this.startDrag(e, this, 1)
        };
        leftDragger.ontouchstart = (e) => {
            this.startDrag(e, this, 1)
        };
        rightDragger.onmousedown = (e) => {
            this.startDrag(e, this, 2)
        };
        rightDragger.ontouchstart = (e) => {
            this.startDrag(e, this, 2)
        };
        selector.onmousedown = (e) => {
            this.startDrag(e, this, 0)
        };
        selector.ontouchstart = (e) => {
            this.startDrag(e, this, 0)
        };
        field.onmousemove = (e) => {
            this.select(e, this, true);
        };
        field.onmouseleave = (e) => {
            this.select(e, this, false);
        };
        field.ontouchstart = (e) => {
            this.select(e, this, true);
        };
        field.ontouchmove = (e) => {
            this.select(e, this, true);
        };
        field.ontouchend = (e) => {
            this.select(e, this, false);
        };
        //#endregion

        console.debug("ChartController created", this);
    }

    select(eventArgs, sender, visible) {
        if (!eventArgs.clientX && eventArgs.touches && eventArgs.touches.length > 0) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();
        let percent = (eventArgs.clientX - this.field.offsetLeft) 
            / this.field.clientWidth;

        this.onselect(eventArgs.clientX, percent, visible);
    }

    /**
     * Starts element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {ChartController} sender Sender element's class.
     * @param {Number} type Type of dragging (0-2).
     */
    startDrag(eventArgs, sender, type) {
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.stopPropagation();
        eventArgs.preventDefault();

        //Save the old postion and register the events
        sender.positionOld = eventArgs.clientX;
        document.onmouseup = (e) => {
            sender.stopDrag(sender)
        };
        document.ontouchend = (e) => {
            sender.stopDrag(sender)
        };
        document.onmousemove = (e) => {
            sender.drag(e, sender, type)
        };
        document.ontouchmove = (e) => {
            sender.drag(e, sender, type)
        };

        console.debug("Dragging started.");
    }

    /**
     * Performs element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {ChartController} sender Sender element's class.
     * @param {Number} type Type of dragging (0-2).
     */
    drag(eventArgs, sender, type) {
        console.debug("Dragging...")
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();

        //Calculate the new position
        sender.positionNew = sender.positionOld - eventArgs.clientX;
        sender.positionOld = eventArgs.clientX;

        //Set the style
        if (type === 0) {
            let left = sender.selector.offsetLeft - sender.positionNew;
            if (left < 0) left = 0;

            sender.selector.style.left = left + "px";
        } else if (type === 1) {
            let width = sender.selector.clientWidth + sender.positionNew;
            let left = sender.selector.offsetLeft - sender.positionNew;

            if (width < sender.minWidth) {
                left += width - sender.minWidth;
                width = sender.minWidth;
            }
            if (left < 0) {
                width -= -left;
                left = 0;
            }

            sender.selector.style.left = left + "px";
            sender.selector.style.width = width + "px";
        } else if (type === 2) {
            let width = sender.selector.clientWidth - sender.positionNew;
            if (width + sender.selector.offsetLeft + sender.borderWidth >
                sender.selector.parentNode.clientWidth) {
                width = sender.selector.clientWidth;
            }

            sender.selector.style.width = width + "px";
        }

        sender.normalize();
        sender.update();
    }

    /**
     * Stops element dragging.
     */
    stopDrag(sender) {
        //Clear the events
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;

        sender.onstop();
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

Math.interpolate = (min, max, value) => {
    return min + (value * (max - min));
}
//#endregion