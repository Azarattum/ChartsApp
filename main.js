"use strict";
console.debugging = true; ///DEBUG!
var Charts;
var Drawer;
var Preview;

loadData("chart_data.json", (source) => {
    Charts = Chart.array(source);
    let canvas = document.getElementById("chart");
    let preview = document.getElementById("preview");
    let chart = Charts[0];
    Drawer = new ChartDrawer(chart, canvas);
    Preview = new ChartDrawer(chart, preview);
    
    render();
    preview.width = preview.clientWidth;
    preview.height = preview.clientHeight;
    Preview.draw();

    //Get elements
    let selector = document.getElementById("select"),
        leftDragger = document.getElementById("left-dragger"),
        rightDragger = document.getElementById("right-dragger"),
        coverLeft = document.getElementById("cover-left"),
        coverRight = document.getElementById("cover-right");

    let controller = new ChartController(selector, leftDragger, rightDragger, (start, end) => {
        coverLeft.style.width = start + "%";
        coverRight.style.width = (100 - end) + "%";
        Drawer.start = start;
        Drawer.end = end;
        render();
    });

    window.onresize = () => {
        preview.width = preview.clientWidth;
        preview.height = preview.clientHeight;
        Preview.draw();
        render();
    };

    function render() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        Drawer.draw();
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
    draw() {
        if (!this.visible) return;
        //Set color
        this.context.strokeStyle = this.graph.color;
        this.context.lineWidth = 2.5;
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
        /**The maximum drawing size.*/
        this.size = 0;
        /**The minimal left bound.*/
        this.minLeft = Number.MAX_SAFE_INTEGER;
        /**The maximum right bound.*/
        this.maxRight = -Number.MAX_SAFE_INTEGER;
        /**Whether adjust drawing height automaticaly depending on maximum point or not.*/
        this.autoHeight = true;
        /**Clear function.*/
        this.clear = () => {};
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
    }

    /**
     * Draws the graphs of the chart.
     */
    drawGraphs() {
        for (const drawer of this.graphDrawers) {
            drawer.draw();
        }
    }
}

class ChartController {
    constructor (selector, leftDragger, rightDragger, onupdate)
    {
        //#region Properties
        this.selector = selector;
        this.borderWidth = parseInt(window.getComputedStyle(selector)["border-left-width"]) * 2;
        this.minWidth = 
            parseInt(window.getComputedStyle(selector)["min-width"]) + this.borderWidth;

        this.positionOld = 0;
        this.positionNew = 0;
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

    stopDrag() {
        //Clear the events
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;

        console.debug("Dragging stopped.");
    }

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