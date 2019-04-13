/**
 * Class for drawing chart layouts such as axises.
 */
class LayoutDrawer {
    /**
     * Creates an object for drawing a layout.
     * @param {Element} canvas The canvas for drawing layout.
     */
    constructor(chartDrawer, canvas, gl) {
        //#region Fields

        //Core

        /**Chart drawer object.*/
        this.chartDrawer = chartDrawer;
        /**Layout canvas.*/
        this.canvas = canvas;
         /**Layout canvas context.*/
        this.context = canvas.getContext("2d");
        /**GL Object.*/
        this.gl = gl;

        //Custom properties

        /**Amount of line to draw.*/
        this.opacity = 192;
        this.lineCount = 6;
        this.dateCount = 7;
        this.color = new Color();
        this.font = "Helvetica";

        //Animations

        /**Object that contains all animated properties.*/
        this.animations = {
            lineFade: new AnimationObject(64),
            lineOffset: new AnimationObject(0),
            dateFade: [],
            dateOffset: new AnimationObject(0)
        };

        //#endregion

        this._initializeAttributes();
        

        console.debug("LayoutDrawer created", this);
    }

    //#region Properties
    get animating() {
        return Object.values(this.animations).some(x => x.inProgress) ||
            this.animations.dateFade.some(x => x.inProgress);
    }
    //#endregion

    //#region Private methods
    _initializeAttributes() {
        this.stack = this.gl.newStack();

        let lines = [];
        ///IMPLEMENT A SEPARATE SHADER FOR THE LAYOUT TO AVOID THE CODE BELLOW!!!
        let directions = [];
        for (let i = 0; i < this.lineCount + 1; i++) {
            lines.push(-1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1);
            lines.push(1.1 * Math.pow(-1, i), 2 / this.lineCount * i - 1);
            directions.push(0);
            directions.push(0);
        }

        this.gl.attributes.position = lines;
        this.gl.attributes.direction = directions;
    }

    ///MOVE TO Y AXIS!!!
    /**
     * Draws layout lines.
     */
    _drawLines(move, graphValue) {
        let projection = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
        let color = this.color.alpha(this.opacity);

        //Draw zero axis line
        this.gl.stack = this.stack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = this.color.alpha(this.opacity).toArray();
        this.gl.drawStrip(2);

        //Setup lines animations
        projection[7] = move % (2 / this.lineCount);
        if (projection[7] > (move % (1 / this.lineCount))) {
            this.animations.lineFade.set(0, ANIMATION_PERIOD * 2);
        } else {
            this.animations.lineFade.set(this.opacity / 3, ANIMATION_PERIOD * 2);
        }
        //Additionally animating offset depeding of lines fade
        projection[7] -= 
            (this.animations.lineFade.get() / this.opacity / 3) / this.lineCount;

        //Draw the first pack of lines
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = this.color
            .alpha(this.animations.lineFade.get()).toArray();
        this.gl.drawStrip((this.lineCount + 1) * 2, 1);

        //Draw the first pack of values
        this._drawValues(
            projection[7], 
            color.alpha(this.animations.lineFade.get()),
            graphValue
        );

        //Draw the second pack of lines (with offset and inverted alpha)
        projection[7] -= 1 / this.lineCount;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = this.color
            .alpha(this.opacity / 3 - this.animations.lineFade.get()).toArray();
        this.gl.drawStrip((this.lineCount + 1) * 2, 1);

        //Draw the second pack of values (with offset and inverted alpha)
        this._drawValues(
            projection[7],
            this.color.alpha(this.opacity / 3 - this.animations.lineFade.get()),
            graphValue
        );
    }

    /**
     * Draws y axis values.
     */
    _drawValues(y, color, graphValue) {
        const lineSpace = this.gl.canvas.height / this.lineCount;
        let textColor = new Color(color);
        textColor.a *= 2;
        y = y * this.gl.canvas.height / 2 + 3 * window.devicePixelRatio;
        this.context.fillStyle = textColor.toString();
        this.context.font = lineSpace / 4 + "px " + this.font;

        for (let i = 0; i < this.lineCount; i++) {
            const textY = -y + i * lineSpace;
            if (textY > this.gl.canvas.height) continue;
            if (textY - lineSpace / 4 < 0) continue;
            let label = (this.gl.canvas.height - textY) / this.gl.canvas.height * graphValue;
            //Format value
            const absolute = Math.abs(label);
            if (absolute > 1000000000) {
                label = parseFloat((label / 1000000000).toFixed(2)) + "B";
            }
            else if (absolute > 1000000) {
                label = parseFloat((label / 1000000).toFixed(2)) + "M";
            }
            else if (absolute > 1000) {
                label = parseFloat((label / 1000).toFixed(1)) + "K";
            }
            else {
                label = Math.round(label);
            }

            this.context.fillText(label, 0, textY);
        }
    }

    /**
     * Draws layout dates.
     */
    _drawDates(scale, chart, area) {
        const dateSpace = this.canvas.width / (this.dateCount - 1);
        const margin = ((this.canvas.height - this.gl.canvas.height) / 2);
        const ratio = chart.size.x / this.canvas.width;
        const y = this.canvas.height - margin / 1.5;

        this.context.font = margin + "px " + this.font;

        this.animations.dateOffset.set(-area.start * this.canvas.width, ANIMATION_PERIOD / 2);
        this.context.fillStyle = this.color.toString();

        //Cycle trough all dates to draw
        for (let j = 1; j < scale || 
            (this.animations.dateFade[j] && this.animations.dateFade[j].get()); j *= 2) {
            
            //Setting dates fade animation
            if (this.animations.dateFade[j] == undefined) {
                this.animations.dateFade[j] = new AnimationObject(this.opacity);
            }
            if (scale > j && !this.animations.dateFade[j].inProgress && j != 1) {
                this.animations.dateFade[j].set(this.opacity, ANIMATION_PERIOD);
            } else if (!this.animations.dateFade[j].inProgress && j != 1) {
                this.animations.dateFade[j].set(0, ANIMATION_PERIOD);
            }

            //Set color before drawing
            this.context.fillStyle = 
                this.color.alpha(this.animations.dateFade[j].get()).toString();

            //Cycle trough dates of the whole axis
            for (let i = (j == 1 ? 0 : 1); i < this.dateCount * j; i += (j == 1 ? 1 : 2)) {
                let x = dateSpace * scale * i / j;
                let label = Math.round(chart.offsets.x + x * ratio / scale);
                x += this.animations.dateOffset.get() * scale;

                //But render only if visible
                if (x > this.canvas.width) continue;
                if ((x + margin * 4) < 0) continue;

                //Format label
                label = (new Date(label)).toString().split(' ')[1] + " " +
                    (new Date(label)).toString().split(' ')[2];

                //Render using 2D context
                this.context.fillText(label, x, y);
            }
        }
    }
    //#endregion

    //#region Public methods
    /**
     * Draws the layout.
     */
    draw() {
        const projection = this.chartDrawer.animations.projection.get();
        const move = projection[7];
        const scaleY = projection[4];
        const scaleX = projection[0];
        const graphValue = this.chartDrawer.chart.size.y / scaleY;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._drawLines(move, graphValue);
        this._drawDates(scaleX, this.chartDrawer.chart, this.chartDrawer.area);
    }
    //#endregion
}