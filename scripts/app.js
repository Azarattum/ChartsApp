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

    let mat = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ];

    let path = new Path(chart.graphs[0].vertices);
    gl.indices = path.indices;

    gl.attributes.position = path.vertices;
    gl.attributes.next = path.nexts;
    gl.attributes.previous = path.previouses;
    gl.attributes.direction = path.directions;

    gl.uniforms.aspect = canvas.width / canvas.height;
    gl.uniforms.projection = mat;
    gl.uniforms.thickness = 5 / canvas.height;
    gl.uniforms.miter = 1;
    gl.drawElements(path.length);

    console.log(path);
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