console.debugging = true; ///DEBUG!
var Charts;

loadData("chart_data.json", (source) => {
    Charts = Chart.array(source);
    ///TESTING!
    let canvas = document.getElementById("chart");
    let graphDrawer1 = new GraphDrawer(Charts[0].graphs[0], canvas, {left: 0, bottom: 32});
    let graphDrawer2 = new GraphDrawer(Charts[0].graphs[1], canvas);
    //graphDrawer1.bounds.left  = 1548633600000;
    //graphDrawer1.bounds.right = 1550003200000;
    
    graphDrawer1.drawGraph();    
    graphDrawer2.drawGraph();
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
        //Setup canvas
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

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
        /**Size of viewing area*/
        this.view = {
            width: +canvas.width - this.offsets.left,
            height: +canvas.height - this.offsets.bottom
        }
        /**Drawing context.*/
        this.context = canvas.getContext("2d");
        //#endregion

        console.debug("GraphDrawer created", this);
    }

    /**
     * Draws the graph depending on current settings.
     */
    drawGraph() {
        //Set color
        this.context.strokeStyle = this.graph.color;
        this.context.lineWidth = 2.5;
        let widthRatio = this.view.width / (this.maxBounds.right - this.maxBounds.left);
        let heightRatio = this.view.height / (this.maxBounds.top - this.maxBounds.bottom);
        widthRatio *=  (this.maxBounds.right - this.maxBounds.left) / (this.bounds.right - this.bounds.left);
        //Start drawing
        this.context.beginPath();
        let lastPoint = false;

        for (const x in this.graph.values) {
            if (lastPoint) break;
            
            if (x > this.bounds.right)
                lastPoint = true;
            
            const y = this.graph.values[x];
            if (x < this.bounds.left || y < this.bounds.bottom || y > this.bounds.top)
                continue;

            let dx = (x - this.bounds.left) * widthRatio + this.offsets.left;
            let dy = (y - this.bounds.bottom) * heightRatio;
            
            this.context.lineTo(dx, this.view.height - dy);
            console.debug("Draw to", dx, dy);
        }

        this.context.stroke();
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