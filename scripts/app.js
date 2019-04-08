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
    let viewport = {
        width:gl.viewport.width,
        height:gl.viewport.height
    };
    let vertices = Path.getVertices(chart.graphs[0].vertices, 4, viewport);

    /*gl.attribute.position = vertices;
    gl.uniform.alpha = 0.5;
    gl.drawTriangles(vertices.length / 2);*/

    vertices = [];
    for (const vertex of chart.graphs[0].vertices) {
        vertices.push(vertex.x);
        vertices.push(vertex.y);
    }
    console.log(chart.graphs[0].vertices);

    gl.attribute.position = vertices;
    gl.uniform.alpha = 1.0;
    gl.drawStrip(vertices.length / 2);

    vertices = [];
    for (const vertex of chart.graphs[0].vertices) {
        vertices.push(vertex.x);
        vertices.push(vertex.y - 2 / canvas.height);
    }
    console.log(chart.graphs[0].vertices);

    gl.attribute.position = vertices;
    gl.uniform.alpha = 1.0;
    gl.drawStrip(vertices.length / 2);
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