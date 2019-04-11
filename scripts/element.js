class ChartElement {
    constructor(container) {
        this.initializeComponent();
    }
    
    initializeComponent() {
        //Title
        this.title = document.createElement("span");
        
        this.title.className = "chart-title";
        
        //Tooltip
        this.tootip = document.createElement("div");
        this.date = document.createElement("span");
        this.values = document.createElement("div");
        
        this.tooltip.className = "chart-tooltip";
        this.date.className = "chart-tooltip-date";
        this.values.className = "chart-tooltip-values";
        
        this.tooltip.appendChild(this.date);
        this.tooltip.appendChild(this.values);
        
        //Render
        this.render = document.createElement("div");
        this.chart = document.createElement("canvas");
        this.layout = document.createElement("canvas");
        
        this.render.className = "chart-render";
        this.chart.className = "chart-render-chart";
        this.layout.className = "chart-render-layout";
        
        this.render.appendChild(this.chart);
        this.render.appendChild(this.layout);
        
        //Preview
        this.control = document.createElement("div");
        this.preview = document.createElement("canvas");
        this.select = document.createElement("div");
        this.draggerLeft = document.createElement("div");
        this.draggerRight = document.createElement("div");
        this.coverLeft = document.createElement("div");
        this.coverRight = document.createElement("div");
        
        this.control.className = "chart-control";
        this.preview.className = "chart-preview";
        this.select.className = "chart-select";
        this.draggerLeft.className = "chart-dragger chart-dragger-left";
        this.draggerRight.className = "chart-dragger chart-dragger-right";
        this.coverLeft.className = "chart-cover chart-cover-left";
        this.coverRight.className = "chart-cover chart-cover-right";
        
        this.control.appendChild(this.preview);
        this.control.appendChild(this.coverLeft);
        this.control.appendChild(this.select);
        this.select.appendChild(this.draggerLeft);
        this.select.appendChild(this.draggerRight);
        this.control.appendChild(this.coverRight);
        
        //Graph buttons container
        this.graphs = document.createElement("div");

        this.graphs.className = "chart-graphs";
        
        //Main container
        this.container = document.createElement("div");
        
        this.container.className = "chart-container";
        
        this.container.appendChild(this.tootip);
        this.container.appendChild(this.tootip);
        this.container.appendChild(this.render);
        this.container.appendChild(this.control);
        this.container.appendChild(this.graphs);
    }

    initializeStyle() {
        
    }

    set chart(chart) {
        
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
        let percent = (eventArgs.clientX - this.field.offsetLeft) / this.field.clientWidth;

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