console.debugging = true;
const ANIMATION_PERIOD = 200;
var chart;

load({
    "data/1/overview.json": "chart",
    "scripts/line.frag": "lineFragShader",
    "scripts/line.vert": "lineVertShader",
}, (data) => {
    console.debug(data);

    const container = document.getElementById("chart");
    const shaders = {
        line: [data["lineVertShader"], data["lineFragShader"]]
    };
    const pageStyle = getComputedStyle(document.getElementsByClassName("page")[0]);

    chart = new ChartElement(container, shaders);
    chart.chart = data["chart"];
    chart.style = {
        background: pageStyle.getPropertyValue("--color-background"),
        text: pageStyle.getPropertyValue("--color-text"),
        font: pageStyle["font-family"],
        lowlight: pageStyle.getPropertyValue("--lowlight")
    }

    requestAnimationFrame(draw);

    function draw() {
        chart.render();
        requestAnimationFrame(draw);
    }
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