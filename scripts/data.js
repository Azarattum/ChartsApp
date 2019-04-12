class Chart {
    /**
     * Creates a chart object.
     * @param {Object} source Source JSON string, object or filename to create a chart.
     */
    constructor(source) {
        //#region Properties
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

        //#region Create graphs
        const shift = typeof source.columns[0][0] == "string";
        let xAxis = source.columns[0];
        if (shift) xAxis.shift();

        this.size = new Point(-Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
        this.offsets = new Point(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        for (let i = 1; i < source.columns.length; i++) {
            let yAxis = source.columns[i];
            if (shift) yAxis.shift();
            const id = Object.keys(source.names)[i - 1];
            const color = new Color(source.colors[id]);
            const name = source.names[id];
            const type = source.types[id];

            //Create a graph
            const graph = new Graph(xAxis, yAxis, color, name, type);
            if (graph.size.x > this.size.x) {
                this.size.x = graph.size.x;
            }
            if (graph.size.y > this.size.y) {
                this.size.y = graph.size.y;
            }
            if (graph.minX < this.offsets.x) {
                this.offsets.x = graph.minX;
            }
            if (graph.minY < this.offsets.y) {
                this.offsets.y = graph.minY;
            }
            this.graphs.push(graph);
        }

        this.graphs = this.graphs.sort(function(a, b){return b.maxY-a.maxY});

        this.type = this.graphs[0].type;

        ///FOR SINGLE Y!
        let lowerVertices = [];
        //Calculate graph vertices according to the biggest size
        this.graphs.forEach(x => x.calculateVertices(this.size, this.offsets));
        //#endregion

        console.debug("Chart created", this);
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
    constructor(xAxis, yAxis, color, name, type) {
        //#region Properties
        /**Graph color.*/
        this.color = color;
        /**Graph name.*/
        this.name = name;
        /**Graph type.*/
        this.type = type;
        /**Top values.*/
        this.maxX = -Number.MAX_SAFE_INTEGER;
        this.minX = Number.MAX_SAFE_INTEGER;
        this.maxY = -Number.MAX_SAFE_INTEGER;
        this.minY = Number.MAX_SAFE_INTEGER;
        /**Graph points.*/
        this.points = [];
        /**Graph normalized points.*/
        this.vertices = [];
        for (let i = 0; i < xAxis.length; i++) {
            const x = xAxis[i];
            const y = yAxis[i];

            if (x > this.maxX) this.maxX = x;
            if (x < this.minX) this.minX = x;
            if (y > this.maxY) this.maxY = y;
            if (y < this.minY) this.minY = y;

            this.points.push(new Point(x, y));
            this.vertices.push(new Point(x, y));
        }
        /**Graph size.*/
        this.size = new Point(this.maxX - this.minX, this.maxY - this.minY);

        //#endregion
        console.debug("Graph created", this);
    }

    calculateVertices(maxSize, minSize) {
        this.vertices.forEach((point, index) => {
            point.x = (point.x - minSize.x) / maxSize.x * 2 - 1;
            point.y = (point.y - minSize.y) / maxSize.y * 2 - 1;
        });
    }
}