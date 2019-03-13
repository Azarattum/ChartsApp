console.debugging = true; ///DEBUG!
var Charts;

loadData("chart_data.json", (source) => {
    Charts = Chart.array(source);
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