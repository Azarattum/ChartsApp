class ChartElement {
    constructor(container, shadersPack) {
        this.elements = {};
        this.styles = {};
        this.shaders = shadersPack;
        this.elements.container = container;
        this.initializeComponent();

        //Default styles
        this.styles.text = "#000";
        this.styles.background = "#FFF";
        this.styles.font = "inherit";
        this.styles.margin = "8px";
        this.styles.dates = "24px";
        this.styles.preview = "48px";
        this.styles.lowlight = "0.1";
        this.styles.border = "1px";
        this.styles.select = "48px";
        this.initializeStyle();
    }

    initializeComponent() {
        //Title
        this.elements.title = document.createElement("span");

        this.elements.title.className = "chart-title";

        //Tooltip
        this.elements.tooltip = document.createElement("div");
        this.elements.date = document.createElement("span");
        this.elements.values = document.createElement("div");

        this.elements.tooltip.className = "chart-tooltip";
        this.elements.date.className = "chart-tooltip-date";
        this.elements.values.className = "chart-tooltip-values";

        this.elements.tooltip.appendChild(this.elements.date);
        this.elements.tooltip.appendChild(this.elements.values);

        //Render
        this.elements.render = document.createElement("div");
        this.elements.chart = document.createElement("canvas");
        this.elements.layout = document.createElement("canvas");

        this.elements.render.className = "chart-render";
        this.elements.chart.className = "chart-render-chart";
        this.elements.layout.className = "chart-render-layout";

        this.elements.render.appendChild(this.elements.chart);
        this.elements.render.appendChild(this.elements.layout);

        //Preview
        this.elements.control = document.createElement("div");
        this.elements.preview = document.createElement("canvas");
        this.elements.select = document.createElement("div");
        this.elements.draggerLeft = document.createElement("div");
        this.elements.draggerRight = document.createElement("div");
        this.elements.coverLeft = document.createElement("div");
        this.elements.coverRight = document.createElement("div");

        this.elements.control.className = "chart-control";
        this.elements.preview.className = "chart-preview";
        this.elements.select.className = "chart-select";
        this.elements.draggerLeft.className = "chart-dragger chart-dragger-left";
        this.elements.draggerRight.className = "chart-dragger chart-dragger-right";
        this.elements.coverLeft.className = "chart-cover chart-cover-left";
        this.elements.coverRight.className = "chart-cover chart-cover-right";

        this.elements.control.appendChild(this.elements.preview);
        this.elements.control.appendChild(this.elements.coverLeft);
        this.elements.control.appendChild(this.elements.select);
        this.elements.select.appendChild(this.elements.draggerLeft);
        this.elements.select.appendChild(this.elements.draggerRight);
        this.elements.control.appendChild(this.elements.coverRight);

        //Graph buttons container
        this.elements.graphs = document.createElement("div");

        this.elements.graphs.className = "chart-graphs";

        //Main container
        this.elements.container.className += " chart-container";

        this.elements.container.appendChild(this.elements.title);
        this.elements.container.appendChild(this.elements.tooltip);
        this.elements.container.appendChild(this.elements.render);
        this.elements.container.appendChild(this.elements.control);
        this.elements.container.appendChild(this.elements.graphs);
    }

    initializeStyle() {
        this.elements.container.style.font = this.styles.font;

        

        this.elements.title.style.display = "block";
        this.elements.title.style.fontWeight = "bold";
        this.elements.title.style.color = this.styles.text;
        this.elements.title.style.marginLeft = parseInt(this.styles.margin) / 2 + "px";
        this.elements.title.style.marginBottom = parseInt(this.styles.margin) + "px";

        this.elements.render.style.position = "relative";
        this.elements.render.style.width = "100%";
        this.elements.render.style.height = "50vh";
        this.elements.render.style.marginBottom = parseInt(this.styles.margin) + "px";

        this.elements.chart.style.position = "absolute";
        this.elements.chart.style.height = "calc(100% - " + parseInt(this.styles.dates) + "px)";
        this.elements.chart.style.width = "100%";

        this.elements.layout.style.position = "absolute";
        this.elements.layout.style.height = "100%";
        this.elements.layout.style.width = "100%";

        this.elements.control.style.position = "relative";
        this.elements.control.style.width = "100%";
        this.elements.control.style.height = parseInt(this.styles.preview) + "px";
        this.elements.control.style.touchAction = "none";
        this.elements.control.style.userSelect = "none";
        this.elements.control.style.marginBottom = parseInt(this.styles.margin) + "px";

        this.elements.preview.style.position = "absolute";
        this.elements.preview.style.width = "100%";
        this.elements.preview.style.height = "100%";

        this.elements.coverLeft.style.position = "absolute";
        this.elements.coverLeft.style.left = "0";
        this.elements.coverLeft.style.height = "100%";
        this.elements.coverLeft.style.backgroundColor = this.styles.background;
        this.elements.coverLeft.style.opacity = "0.6";
        this.elements.coverLeft.style.userSelect = "none";
        this.elements.coverLeft.style.filter = "brightness(" + (1 - this.styles.lowlight) + ")";

        this.elements.coverRight.style.position = "absolute";
        this.elements.coverRight.style.right = "0";
        this.elements.coverRight.style.height = "100%";
        this.elements.coverRight.style.backgroundColor = this.styles.background;
        this.elements.coverRight.style.opacity = "0.6";
        this.elements.coverRight.style.filter = "brightness(" + (1 - this.styles.lowlight) + ")";

        this.elements.select.style.position = "absolute";
        this.elements.select.style.height = "calc(100% - " + parseInt(this.styles.border) + "px * 2)";
        this.elements.select.style.minWidth = parseInt(this.styles.select) + "px";
        this.elements.select.style.maxWidth = "calc(100% - " - parseInt(this.styles.select) + "px * 8)";
        this.elements.select.style.opacity = "0.2";
        this.elements.select.style.border = parseInt(this.styles.border) + "px solid " + this.styles.text;
        this.elements.select.style.borderLeftWidth = parseInt(this.styles.border) * 4 + "px";
        this.elements.select.style.borderRightWidth = parseInt(this.styles.border) * 4 + "px";
        this.elements.select.style.cursor = "grab";
        this.elements.select.style.zIndex = "100";

        this.elements.draggerLeft.style.position = "absolute";
        this.elements.draggerLeft.style.left = "-18px";
        this.elements.draggerLeft.style.height = "100%";
        this.elements.draggerLeft.style.width = "24px";
        this.elements.draggerLeft.style.cursor = "ew-resize";
        this.elements.draggerLeft.style.zIndex = "100";

        this.elements.draggerRight.style.position = "absolute";
        this.elements.draggerRight.style.right = "-18px";
        this.elements.draggerRight.style.height = "100%";
        this.elements.draggerRight.style.width = "24px";
        this.elements.draggerRight.style.cursor = "ew-resize";
        this.elements.draggerRight.style.zIndex = "100";
    }

    update() {
        this.elements.select.style.left = "0px";
        this.elements.select.style.width = "0px";
        this.drawer.update();
        this.previewer.update();
        this.controller.update();
    }

    render() {
        this.drawer.draw();
        this.previewer.draw();
    }

    set chart(chart) {
        this.chartData = new Chart(chart);

        if (!this.shaders[this.chartData.type]) {
            throw new Error("Cannot load shader of type \"" + this.chartData.type + "\"!");
        }

        let vertex = new Shader(this.shaders[this.chartData.type][0], Shader.types.VERTEX);
        let fragment = new Shader(this.shaders[this.chartData.type][1], Shader.types.FRAGMENT);
        let program = new ShadersProgram(vertex, fragment);

        this.drawer = new ChartDrawer(
            this.chartData,
            this.elements.chart,
            program,
            this.elements.layout
        );

        vertex = new Shader(this.shaders[this.chartData.type][0], Shader.types.VERTEX);
        fragment = new Shader(this.shaders[this.chartData.type][1], Shader.types.FRAGMENT);
        program = new ShadersProgram(vertex, fragment);

        this.previewer = new ChartDrawer(
            this.chartData,
            this.elements.preview,
            program
        );

        this.controller = new ChartController(
            this.elements.select,
            this.elements.draggerLeft,
            this.elements.draggerRight,
            this.elements.layout
        );

        this.controller.onupdate = (start, end) => {
            this.elements.coverLeft.style.width = start * 100 + "%";
            this.elements.coverRight.style.width = (1 - end) * 100 + "%";
            this.drawer.start = start;
            this.drawer.end = end;
        };

        this.controller.onselect = (x, value, visible) => {
            if (visible) {
                this.drawer.select = value;
            } else {
                this.drawer.select = null;
            }
        }

        this.controller.update();

        this.elements.title.innerHTML = "Chart Title";

        //Add buttons
        for (const graphId in this.chartData.graphs) {
            let button = document.createElement("label");
            let checkbox = document.createElement("input");
            let icon = document.createElement("div");
            let cover = document.createElement("div");
            let name = document.createElement("span");
            
            name.innerHTML = this.chartData.graphs[+graphId].name;
            button.style.backgroundColor = this.chartData.graphs[+graphId].color;
            button.style.borderColor = this.chartData.graphs[+graphId].color;
            name.style.color = this.chartData.graphs[+graphId].color;

            button.className = "chart-graph-button";
            name.className = "chart-graph-button-name";
            cover.className = "chart-graph-button-cover";
            icon.className = "chart-graph-button-icon";

            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.style.position = "absolute";
            checkbox.style.opacity = "0";
            
            button.appendChild(checkbox);
            button.appendChild(icon);
            button.appendChild(name);
            button.appendChild(cover);
            this.elements.graphs.appendChild(button);

            button.onclick = (e) => {
                let visibleGraphs = this.drawer.graphDrawers.reduce((n, x) => {
                    return n + (x.visible ? 1 : 0);
                }, 0);

                if (this.drawer.graphDrawers[+graphId].visible && visibleGraphs == 1) {
                    return false;
                }

                this.drawer.toggle(+graphId, checkbox.checked);
                this.previewer.toggle(+graphId, checkbox.checked);
            }
        }

    }

    set style(styles) {
        this.styles.background = new Color(styles.background).toString() || this.styles.background;
        this.styles.text = new Color(styles.text).toString() || this.styles.text;
        this.styles.font = styles.font || this.styles.font;
        this.styles.margin = styles.margin || this.styles.margin;
        this.styles.dates = styles.dates || this.styles.dates;
        this.styles.preview = styles.preview || this.styles.preview;
        this.styles.lowlight = styles.lowlight || this.styles.lowlight;
        this.styles.border = styles.border || this.styles.border;
        this.styles.select = styles.select || this.styles.select;
        this.initializeStyle();

        this.drawer.update(
            new Color(styles.background),
            new Color(styles.text),
            styles.font,
            5
        );
        this.previewer.update(
            new Color(styles.background),
            new Color(styles.text),
            styles.font,
            2
        );
    }
}

class ChartController {
    /**
     * Creates an interactive chart controller.
     * @param {Element} selector Chart area selector element.
     * @param {Element} leftDragger Area left side dragger element.
     * @param {Element} rightDragger Area right side dragger element.
     * @param {Function} onupdate Callback on controller's update.
     */
    constructor(selector, leftDragger, rightDragger, field) {
        //#region Properties
        /**Chart area selector element.*/
        this.selector = selector;
        /**Chart drawing element.*/
        this.field = field;
        /**Border width style of the selector element.*/
        this.borderWidth = parseInt(window.getComputedStyle(selector)["border-left-width"]) * 2;
        /**Minimum width style of the selector element.*/
        this.minWidth =
            parseInt(window.getComputedStyle(selector)["min-width"]) + this.borderWidth;

        /**Old element position for dragging.*/
        this.positionOld = 0;
        /**New element position for dragging.*/
        this.positionNew = 0;
        /**Callback on controller's update.*/
        this.onupdate = () => {};
        /**Callback on changed field selection.*/
        this.onselect = () => {};
        //#endregion
        //#region Events Registration
        leftDragger.onmousedown = (e) => {
            this.startDrag(e, 1)
        };
        leftDragger.ontouchstart = (e) => {
            this.startDrag(e, 1)
        };
        rightDragger.onmousedown = (e) => {
            this.startDrag(e, 2)
        };
        rightDragger.ontouchstart = (e) => {
            this.startDrag(e, 2)
        };
        selector.onmousedown = (e) => {
            this.startDrag(e, 0)
        };
        selector.ontouchstart = (e) => {
            this.startDrag(e, 0)
        };
        field.onmousemove = (e) => {
            this.select(e, true);
        };
        field.onmouseleave = (e) => {
            this.select(e, false);
        };
        field.ontouchstart = (e) => {
            this.select(e, true);
        };
        field.ontouchmove = (e) => {
            this.select(e, true);
        };
        field.ontouchend = (e) => {
            this.select(e, false);
        };
        //#endregion

        console.debug("ChartController created", this);
    }

    /**
     * Updates current selection state and invokes callback.
     * @param {Object} eventArgs Event arguments.
     * @param {Bool} visible Whethe selection is visible now or not.
     */
    select(eventArgs, visible) {
        if (!eventArgs.clientX && eventArgs.touches && eventArgs.touches.length > 0) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();
        let percent = eventArgs.offsetX / this.field.clientWidth;

        this.onselect(eventArgs.clientX, percent, visible);
    }

    /**
     * Starts element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {Number} type Type of dragging (0-2).
     */
    startDrag(eventArgs, type) {
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.stopPropagation();
        eventArgs.preventDefault();

        //Save the old postion and register the events
        this.positionOld = eventArgs.clientX;
        document.onmouseup = (e) => {
            this.stopDrag()
        };
        document.ontouchend = (e) => {
            this.stopDrag()
        };
        document.onmousemove = (e) => {
            this.drag(e, type)
        };
        document.ontouchmove = (e) => {
            this.drag(e, type)
        };

        console.debug("Dragging started.");
    }

    /**
     * Performs element dragging.
     * @param {Object} eventArgs Event arguments.
     * @param {Number} type Type of dragging (0-2).
     */
    drag(eventArgs, type) {
        console.debug("Dragging...")
        eventArgs = eventArgs || window.event;
        if (!eventArgs.clientX && eventArgs.touches) {
            eventArgs.clientX = eventArgs.touches[0].clientX;
        }
        eventArgs.preventDefault();

        //Calculate the new position
        this.positionNew = this.positionOld - eventArgs.clientX;
        this.positionOld = eventArgs.clientX;

        //Set the style
        if (type === 0) {
            let left = this.selector.offsetLeft - this.positionNew;
            if (left < 0) left = 0;

            this.selector.style.left = left + "px";
        } else if (type === 1) {
            let width = this.selector.clientWidth + this.positionNew;
            let left = this.selector.offsetLeft - this.positionNew;

            if (width < this.minWidth) {
                left += width - this.minWidth;
                width = this.minWidth;
            }
            if (left < 0) {
                width -= -left;
                left = 0;
            }

            this.selector.style.left = left + "px";
            this.selector.style.width = width + "px";
        } else if (type === 2) {
            let width = this.selector.clientWidth - this.positionNew;
            if (width + this.selector.offsetLeft + this.borderWidth >
                this.selector.parentNode.clientWidth) {
                width = this.selector.clientWidth;
            }

            this.selector.style.width = width + "px";
        }

        this.normalize();
        this.update();
    }

    /**
     * Stops element dragging.
     */
    stopDrag() {
        //Clear the events
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;

        console.debug("Dragging stopped.");
    }

    /**
     * Makes sure that the element is inside boudary box if not normalizes.
     */
    normalize() {
        if (parseInt(this.selector.style.left) < 0) {
            this.selector.style.left = "0px";
        }
        if ((parseInt(this.selector.style.left) +
                this.selector.clientWidth + this.borderWidth) >
            this.selector.parentNode.clientWidth) {
            this.selector.style.left = (this.selector.parentNode.clientWidth -
                this.selector.clientWidth - this.borderWidth) + "px";
        }
    }

    /**
     * Updates current state of the controller and invokes callback.
     */
    update() {
        let size = this.selector.parentNode.clientWidth;
        let start = this.selector.offsetLeft / size;
        let end = (this.selector.offsetLeft +
            this.selector.clientWidth + this.borderWidth) / size;

        this.onupdate(start, end);
    }

    get dragging() {
        return !(document.onmouseup == null && document.ontouchend == null &&
            document.onmousemove == null && document.ontouchmove == null);
    }
}