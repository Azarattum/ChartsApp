"use strict";
console.debugging = true; ///DEBUG!

loadData("chart_data.json", (source) => {
    let drawer, preview;
    let canvas = document.getElementById("chart");
    let previewCanvas = document.getElementById("preview");
    let charts = Chart.array(source);
    let chartId = 0;

    loadChart(chartId);
    moibleStyle();

    //Get elements
    let selector = document.getElementById("select"),
        leftDragger = document.getElementById("left-dragger"),
        rightDragger = document.getElementById("right-dragger"),
        coverLeft = document.getElementById("cover-left"),
        coverRight = document.getElementById("cover-right");

    //Create controller
    let controller = new ChartController(selector, leftDragger, rightDragger, (start, end) => {
        coverLeft.style.width = start + "%";
        coverRight.style.width = (100 - end) + "%";
        drawer.start = start;
        drawer.end = end;
        render();
    });

    document.getElementsByClassName("title")[0].onclick = () => {
        chartId = (chartId + 1) % charts.length;
        loadChart(chartId);
        controller.update();
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
        drawer.draw();
    }

    function loadChart(id) {
        let chart = charts[id];

        //Create chart drawers
        drawer = new ChartDrawer(chart, canvas, {left: 0, bottom: 48});
        preview = new ChartDrawer(chart, previewCanvas);
        preview.layout = false;
        preview.lineWidth = 2;
        drawer.lineWidth = 5;

        //Update chart title
        document.getElementsByClassName("title")[0].innerHTML = "Chart #" + (id + 1);
        //Update chart buttons
        let graphs = document.getElementsByClassName("graphs")[0];
        graphs.innerHTML = "";
        for (const graphId in chart.graphs) {
            let button = document.createElement("label");
            let checkbox = document.createElement("input");
            let icon = document.createElement("div");
            let name = document.createTextNode(chart.graphs[+graphId].name);

            button.className = "button";
            checkbox.type = "checkbox";
            checkbox.checked = true;
            icon.className = "icon";
            icon.style.backgroundColor = chart.graphs[+graphId].color;

            button.appendChild(checkbox);
            button.appendChild(icon);
            button.appendChild(name);
            graphs.appendChild(button);

            button.onclick = () => {
                drawer.toggle(+graphId, checkbox.checked);
                render();
            }
        }
        
        //Render the chart
        render();
        previewCanvas.width = previewCanvas.clientWidth * 2;
        previewCanvas.height = previewCanvas.clientHeight * 2;
        preview.draw();
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
    constructor (source) {
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
            } 
            catch {
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
            } 
            catch {
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
    constructor (values, color, name) {
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
    constructor (graph, canvas, offsets = {left: 0, bottom: 0}) {
        //#region Properties
        /**The graph to draw.*/
        this.graph = graph;
        /**Maximum drawing bounds.*/
        this.maxBounds = {
            left: +Object.keys(graph.values)[0],
            right: +Object.keys(graph.values)[Object.keys(graph.values).length - 1],
            top: +Math.max.apply(Math, Object.values(graph.values)),
            bottom: 0//+Math.min.apply(Math, Object.values(graph.values))
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
        widthRatio *=  (this.maxBounds.right - this.maxBounds.left) / (this.bounds.right - this.bounds.left);
        //Start drawing
        this.context.beginPath();
        let firstPoint;

        for (const x in this.graph.values) {
            const y = this.graph.values[x];

            if (x < this.bounds.left || y < this.bounds.bottom) {
                firstPoint = x;
                continue;
            }

            if (firstPoint != null)
            {
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
    constructor(canvas) {
        //#region Properties
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        /**Amount of line to draw.*/
        this.lineCount = 6;
        this.dateCount = 6;
        this.lineColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.25)";
        //alert(this.lineColor);
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

    draw(bounds, bottom) {
        //Update colors
        this.lineColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.25)";
        this.textColor = "rgba(" +
            window.getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text").trim() + ", 0.5)";

        this.drawLines(bounds, bottom);
        this.drawDates(bounds, bottom);
    }

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
            this.context.moveTo(0,  y);
            this.context.lineTo(this.view.width, y);
            this.context.stroke();
            
            let label = Math.round(bounds.bottom + area * i);
            this.context.fillText(label, 0, y - margin);
            if (i == 0)
                this.context.strokeStyle = this.lineColor;
        }
    }

    drawDates(bounds, bottom) {
        let spacing = this.view.width / this.dateCount;
        let margin = (bottom / 2) + (bottom - (bottom / 2)) / 2;
        let area = (bounds.right - bounds.left) / this.dateCount;

        this.context.fillStyle = this.textColor;
        this.context.font = (bottom / 2) + "px " + 
            window.getComputedStyle(document.getElementsByClassName("page")[0])["font-family"];

        for (let i = 0; i < this.dateCount; i++) {
            let x = spacing * i;
            
            let label = Math.round(bounds.left + area * i);
            label = (new Date(label)).toString().split(' ')[1] + " " +
                (new Date(label)).toString().split(' ')[2];

            this.context.fillText(label, x + (bottom / 10), this.view.height - bottom + margin);
            if (i == 0)
                this.context.strokeStyle = this.lineColor;
        }
    }
}

class ChartDrawer {
    /**
     * Creates an object for drawing charts.
     * @param {Chart} chart The chart to draw.
     */
    constructor (chart, canvas, offsets = {left: 0, bottom: 0}) {
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
     * Toggles or sets graph's visibility state by id.
     * @param {Number} id Graph id.
     * @param {Boolean} state Visibility state.
     */
    toggle(id, state = undefined) {
        if (state == undefined) {
            this.graphDrawers[id].visible = !this.graphDrawers[id].visible;
        }
        else {
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
            }
            else if (drawer.maxBounds.top > top){
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
        if (this.graphDrawers.some(x => x.visible))
            this.layoutDrawer.draw(this.graphDrawers.find(x => x.visible).bounds, this.offsets.bottom);
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
    constructor (selector, leftDragger, rightDragger, onupdate)
    {
        //#region Properties
        /**Chart area selector element.*/
        this.selector = selector;
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
        this.onupdate = onupdate;
        //#endregion
        //#region Events Registration
        leftDragger.onmousedown = (e) => {this.startDrag(e, this, 1)};
        leftDragger.ontouchstart = (e) => {this.startDrag(e, this, 1)};
        rightDragger.onmousedown = (e) => {this.startDrag(e, this, 2)};
        rightDragger.ontouchstart = (e) => {this.startDrag(e, this, 2)};
        selector.onmousedown = (e) => {this.startDrag(e, this, 0)};
        selector.ontouchstart = (e) => {this.startDrag(e, this, 0)};
        //#endregion

        this.update();

        console.debug("ChartController created", this);
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
        document.onmouseup = sender.stopDrag;
        document.ontouchend = sender.stopDrag;
        document.onmousemove = (e) => {sender.drag(e, sender, type)};
        document.ontouchmove = (e) => {sender.drag(e, sender, type)};

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
        }
        else if (type === 1) {
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
        }
        else if (type === 2){
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
        if ((parseInt(this.selector.style.left) 
            + this.selector.clientWidth + this.borderWidth) > 
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
}
//#endregion

//#region Miscellaneous 
//Active pseudo-class mobile compatibility
document.addEventListener("touchstart", function(){}, true);

//Custom debugging output
console.debug = function() {
    if(!console.debugging) return;
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