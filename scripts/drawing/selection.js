/**
 * Class for drawing the selection line and circles.
 */
class SelectionDrawer {
    //#region Private methods
    _initializeAttributes() {
        /**Selection stack id*/
        this.selectionStack = this.gl.newStack();

        this.gl.attributes.position = [0, -1, 0, 1];
        this.gl.attributes.direction = [0, 0];
    }
    //#endregion

    /**
     * Draws the selection line
     * @param {Number} x Date of line coordinate.
     */
    drawSelection(x, graphProjection) {
        const projection = [
            1, 0, 0,
            0, 1, 0,
            x * graphProjection[0] + graphProjection[6], 0, 1
        ];
        let color = new Color(this.color);
        color.a = 128;

        this.gl.stack = this.selectionStack;
        this.gl.uniforms.projection = projection;
        this.gl.uniforms.color = color.toArray();
        this.gl.drawStrip(2);
    }
}