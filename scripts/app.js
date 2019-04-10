console.debugging = true;
const ANIMATION_PERIOD = 200;
var chart;
var drawer;

load({
    "data/3/overview.json": "chart",
    "scripts/line.frag": "lineShader",
    "scripts/line.vert": "vertexShader",
}, (data) => {
    console.debug(data);
    let vertexShader = new Shader(data["vertexShader"], Shader.types.VERTEX);
    let fragmentShader = new Shader(data["lineShader"], Shader.types.FRAGMENT);
    let program = new ShadersProgram(vertexShader, fragmentShader);
    let canvas = document.getElementById("chart");
    let layout = document.getElementById("layout");
    
    /*===================TESTS!===================*/
    chart = new Chart(data["chart"]);
    drawer = new ChartDrawer(chart, canvas, program, layout);
    drawer.update(
        new Color(
            getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-background")
        ),
        new Color(
            getComputedStyle(document.getElementsByClassName("page")[0])
            .getPropertyValue("--color-text")
        )
    );

    //Get elements
    let selector = document.getElementById("select"),
        leftDragger = document.getElementById("left-dragger"),
        rightDragger = document.getElementById("right-dragger"),
        coverLeft = document.getElementById("cover-left"),
        coverRight = document.getElementById("cover-right");
    //Create controller
    let controller = new ChartController(selector, leftDragger, rightDragger, layout);
    controller.onupdate = (start, end) => {
        coverLeft.style.width = start * 100 + "%";
        coverRight.style.width = (1 - end) * 100 + "%";
        drawer.start = start;
        drawer.end = end;
    };
    controller.onselect = (x, value, visible) => {
        drawer.select = value;
        /*drawer.select = visible ? value : undefined;
        let tooltip = document.getElementById("tooltip");
        let left = (x - tooltip.clientWidth / 3) + "px";
        if (parseInt(left) < 0) {
            left = "0px";
        }
        if (parseInt(left) >=
            (tooltip.parentNode.clientWidth - tooltip.clientWidth -
                parseInt(window.getComputedStyle(document.getElementsByClassName("page")[0])
                    .getPropertyValue("--main-margin")))) {
            left = (tooltip.parentNode.clientWidth - tooltip.clientWidth -
                parseInt(window.getComputedStyle(document.getElementsByClassName("page")[0])
                    .getPropertyValue("--main-margin"))) + "px";
        }
        tooltip.style.left = left;

        tooltip.style.opacity = visible ? "1" : "0";

        if (visible) {
            let date = new Date(+drawer.selection.date).toString();
            date = date.split(" ")[0] + ", " + date.split(" ")[1] + " " + date.split(" ")[2];
            document.getElementById("date").innerHTML = date;
            let values = document.getElementById("values").children;
            for (let i = 0; i < values.length; i++) {
                values[i].style.display = drawer.graphDrawers[i].visible ? "block" : "none";
                values[i].children[0].innerHTML = drawer.selection.values[i];
            }
        }*/
    };
    controller.update();

    requestAnimationFrame(draw);

    function draw() {
        drawer.draw();
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