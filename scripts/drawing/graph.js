/**
 * Abstract class from all graph drawers.
 */
class GraphDrawer {
    /**
     * Creates an object for drawing graphs.
     * @param {Graph} graph The graph to draw.
     */
    constructor(chartDrawer, graph, gl, shaders) {
        //Abstract exception
        if (new.target === GraphDrawer) {
            throw new TypeError("Cannot construct an abstract class.");
        }

        //#region Fields

        //Core stuff

        /**Shaders source*/
        this.shaders = shaders;
        /**Chart drawer object.*/
        this.chartDrawer = chartDrawer;
        /**The graph to draw.*/
        this.graph = graph;
        /**Path of graph vertices.*/
        this.path = null;
        /**GL Object.*/
        this.gl = gl;
        /**GL stack is.*/
        this.stack = null;

        //Custom properties

        /**Visibility state of the graph.*/
        this.visible = true;
        /**Cuts buffer for transfering the data to child objects.*/
        this.cuts = {};

        //Animations

        /**Object that contains all animated properties.*/
        this.animations = {
            /**Graph color*/
            color: new AnimationObject(this.graph.color.alpha(0), this.graph.color, ANIMATION_PERIOD * 4)
        };

        //#endregion

        //Initializing program
        this.program = this._initializeProgram();

        //Submitting gl attributes
        this._initializeAttributes();

        console.debug("GraphDrawer created", this);
    }

    //#region Properties
    set color(value) {
        this.animations.color.set(value, ANIMATION_PERIOD / 2);
    }

    get color() {
        return this.animations.color.get();
    }

    get animating() {
        return Object.values(this.animations).some(x => x.inProgress);
    }
    //#endregion

    //#region Private methods
    _initializeProgram() {
        const vertex = new Shader(this.shaders[0], Shader.types.VERTEX);
        const fragment = new Shader(this.shaders[1], Shader.types.FRAGMENT);
        this.program = this.gl.newProgram(new ShadersProgram(vertex, fragment));
    }

    _initializeAttributes() {
        throw new Error("The method is not implemented!");
    }
    //#endregion

    //#region Public methods
    /**
     * Toggles the graph visiblity.
     */
    toggle() {
        this.color = new Color(this.color.r, this.color.g, this.color.b, +(!this.visible) * 255);
        this.visible = !this.visible;
    }

    /**
     * Draws the graph depending on current settings.
     */
    draw() {
        //Prepearing gl for render
        this.gl.program = this.program;
        this.gl.stack = this.stack;
        this.gl.uniforms.projection = this.chartDrawer.animations.projection.get();
        this.gl.uniforms.color = this.color.toArray();

        this.cuts.start = Math.floor(this.chartDrawer.animations.cuts.get()[0]);
        this.cuts.end = Math.ceil(this.chartDrawer.animations.cuts.get()[1]);
        //Left additional points off the screen to avoid artifacts
        if (this.cuts.end < this.graph.length) this.cuts.end++;
        if (this.cuts.end < this.graph.length) this.cuts.end++;
        if (this.cuts.start > 0) this.cuts.start--;
    }
    //#endregion
}