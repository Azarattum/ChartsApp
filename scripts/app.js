console.debugging = true;
const ANIMATION_PERIOD = 200;
var charts = [];

load({
    "data/1/overview.json": "chart1",
    "data/2/overview.json": "chart2",
    "data/3/overview.json": "chart3",
    "data/4/overview.json": "chart4",
    "data/5/overview.json": "chart5",
    "shaders/line.fsh": "lineFragShader",
    "shaders/line.vsh": "lineVertShader",
}, (data) => {
    console.debug(data);

    const pageStyle = getComputedStyle(document.getElementsByClassName("page")[0]);
    const chartsContainer = document.getElementById("charts");

    for (let i = 1; i <= 5; i++) {
        const container = document.createElement("div");
        chartsContainer.appendChild(container);

        const shaders = {
            line: [data["lineVertShader"], data["lineFragShader"]],
            bar: [data["lineVertShader"], data["lineFragShader"]],
            area: [data["lineVertShader"], data["lineFragShader"]]
        };
    
        chartElement = new ChartElement(container, shaders);
        chartElement.chart = data["chart" + i];
        chartElement.style = {
            background: pageStyle.getPropertyValue("--color-background"),
            text: pageStyle.getPropertyValue("--color-text"),
            font: pageStyle["font-family"],
            lowlight: pageStyle.getPropertyValue("--lowlight")
        };

        charts.push(chartElement);
    }

    requestAnimationFrame(draw);

    function draw() {
        for (const chart of charts) {
            chart.render();
        }
        requestAnimationFrame(draw);
    }

    document.getElementsByClassName("theme-switch")[0].onclick = () => {
        setTimeout(() => {
            const pageStyle = getComputedStyle(document.getElementsByClassName("page")[0]);

            document.body.style.backgroundColor = pageStyle["background-color"];
            for (const chart of charts) {
                chart.style = {
                    background: pageStyle.getPropertyValue("--color-background"),
                    text: pageStyle.getPropertyValue("--color-text"),
                    font: pageStyle["font-family"],
                    lowlight: pageStyle.getPropertyValue("--lowlight")
                };
            }
        }, 2);
    };

    window.onresize = () => {
        for (const chart of charts) {
            chart.update();
        }
    };

    document.body.style.backgroundColor = pageStyle["background-color"];
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