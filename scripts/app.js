console.debugging = true;
var gl;
var chart;

load({
    "data/2/overview.json": "chart",
    "scripts/line.frag": "lineShader",
    "scripts/line.vert": "vertexShader",
}, (data) => {
    console.debug(data);
    let vertexShader = new Shader(data["vertexShader"], Shader.types.VERTEX);
    let fragmentShader = new Shader(data["lineShader"], Shader.types.FRAGMENT);
    let program = new ShadersProgram(vertexShader, fragmentShader);
    let canvas = document.getElementById("chart");
    
    gl = new GL(canvas, program);
    gl.background = new Color(
        getComputedStyle(document.getElementsByClassName("page")[0])
        .getPropertyValue("--color-background")
    );
    gl.clear();

    /*===================TESTS!===================*/
    chart = new Chart(data["chart"]);
    let points = chart.graphs[0].points.map((point) => {
        return new Point(
            (point.x - chart.graphs[0].minX) / chart.graphs[0].size.x * canvas.width,
            (point.y - chart.graphs[0].minY) / chart.graphs[0].size.y * canvas.height
        );
    });
    let vertices = Path.getVertices(points, 2);
    vertices = vertices.map((p, i) => {
        if (i % 2 == 0) {
            return p / canvas.width * 2 - 1;
        } else {
            return p / canvas.height * 2 - 1;
        }
    });

    console.log(points);

    gl.attribute.position = vertices;
    gl.uniform.alpha = 1.0;
    gl.drawTriangles(vertices.length / 2);
});

/**
 * Handful function for loading arrays of data with JSON support.
 * @param {Array} urls Array of urls to load.
 * @param {Function} callback Callback(data[]) function.
 */
function load(data, callback) {
    let urls = [];
    let names = false;
    if (Array.isArray(data)) {
        urls = data;
    } else if (typeof data == "object") {
        urls = Object.keys(data);
        names = true;
    } else {
        throw new Error("Data type is not vaild!");
    }

    let responses = [];

    for (const url of urls) {
        let requestObject = new XMLHttpRequest();
        if (url.replace(new RegExp("/$"), "").endsWith(".json")) {
            requestObject.overrideMimeType("application/json");
            requestObject.responseType = "json";
        }

        requestObject.open("GET", url, true);
        requestObject.onreadystatechange = () => {
            if (requestObject.readyState == 4 && requestObject.status == "200") {
                if (!names) {
                    responses.push(requestObject.response);
                } else {
                    let url = urls.find((url) => {
                        let regExp = new RegExp(
                            url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"
                        );
                        return requestObject.responseURL.match(regExp) != null;
                    });

                    responses[data[url]] = requestObject.response;
                }

                if (Object.keys(responses).length == Object.keys(data).length) {
                    callback(responses);
                }
            }
        };
        requestObject.send();
    }
}