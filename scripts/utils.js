class Color {
    constructor(param1, param2, param3, param4) {
        this.color = {
            r: 0,
            g: 0,
            b: 0,
            a: 255
        };
        if (param1 === undefined) {
            return;
        }

        if (Number.isFinite(param1) && Number.isFinite(param2) &&
            Number.isFinite(param3)) {
            this.r = param1;
            this.g = param2;
            this.b = param3;
            if (Number.isFinite(param4)) {
                this.a = param4;
            } else {
                this.a = 255;
            }
            return;
        }

        let colors;
        try {
            colors = param1.match(/^#?([0-9a-f]{3}[0-9a-f]?);?$/i)[1];
            if (colors) {
                this.r = parseInt(colors.charAt(0), 16) * 0x11;
                this.g = parseInt(colors.charAt(1), 16) * 0x11;
                this.b = parseInt(colors.charAt(2), 16) * 0x11;
                if (colors.charAt(3)) {
                    this.a = parseInt(colors.charAt(3), 16) * 0x11;
                } else {
                    this.a = 255;
                }
                return;
            }
        } catch {}

        try {
            colors = param1.match(/^#?([0-9a-f]{6}([0-9a-f]{2})?);?$/i)[1];
            if (colors) {
                this.r = parseInt(colors.substr(0, 2), 16);
                this.g = parseInt(colors.substr(2, 2), 16);
                this.b = parseInt(colors.substr(4, 2), 16);
                if (colors.substr(6, 2)) {
                    this.a = parseInt(colors.substr(6, 2), 16);
                } else {
                    this.a = 255;
                }
                return;
            }
        } catch {}

        try {
            colors = param1.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+)\s*)?\);?$/i);
            if (colors) {
                this.r = colors[1];
                this.g = colors[2];
                this.b = colors[3];
                if (colors[5]) {
                    this.a = colors[5];
                } else {
                    this.a = 255;
                }
                return;
            }
        } catch {}

        try {
            colors = param1.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+)\s*)?;?$/i);
            if (colors) {
                this.r = colors[1];
                this.g = colors[2];
                this.b = colors[3];
                if (colors[5]) {
                    this.a = colors[5];
                } else {
                    this.a = 255;
                }
                return;
            }
        } catch {}
    }

    get r() {
        return this.color.r;
    }

    set r(value) {
        this.color.r = this.normalize(value);
    }

    get g() {
        return this.color.g;
    }

    set g(value) {
        this.color.g = this.normalize(value);
    }

    get b() {
        return this.color.b;
    }

    set b(value) {
        this.color.b = this.normalize(value);
    }

    get a() {
        return this.color.a;
    }

    set a(value) {
        this.color.a = this.normalize(value);
    }

    normalize(value) {
        if (+value > 255)
            return 255;
        else if (+value < 0)
            return 0;
        else
            return Math.round(+value);
    }

    toString() {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }

    toHex() {
        function toHex(number) {
            const hex = number.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        return "#" + toHex(this.r) + toHex(this.g) + toHex(this.b) + toHex(this.a);
    }

    toArray(includeAlpha = true) {
        if (!includeAlpha) {
            return new Float32Array([this.r / 255., this.g / 255., this.b / 255.]);
        } else {
            return new Float32Array([this.r / 255., this.g / 255., this.b / 255., this.a / 255.]);
        }
    }
}

class Point {
    constructor(x = 0, y = 0) {
        this.position = {x: x, y:y};
    }

    get x() {
        return this.position.x;
    }

    set x(value) {
        this.position.x = value;
    }

    get y() {
        return this.position.y;
    }

    set y(value) {
        this.position.y = value;
    }

    normal() {
        return new Point(-this.y, this.x);
    }

    invert() {
        return new Point(-this.x, -this.y);
    }

    normalize() {
        let length = this.length;
        return new Point(this.x / length, this.y / length);
    }

    expand(value) {
        return new Point(this.x * value, this.y * value);
    }

    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }

    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }

    dot(point) {
        return this.x * point.x + this.y * point.y;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class AnimationObject {
    /**
     * Creates an object for animating properties.
     * @param {Number} startProperty Property value at the start of the animation.
     * @param {Number} endProperty Property value at the end of the animation.
     * @param {Number} duration How long the animation will be in milliseconds.
     */
    constructor(startProperty, endProperty = startProperty, duration = 0) {
        this.startTime = Date.now();
        this.duration = duration;
        this.startProperty = startProperty;
        this.endProperty = endProperty;
    }

    /**
     * Returns the property value based on the past time.
     */
    get() {
        let timePast = Date.now() - this.startTime;
        if (timePast > this.duration) return this.endProperty;

        if (typeof this.startProperty == "number") {
            return this.startProperty + ((timePast / this.duration) * (this.endProperty - this.startProperty));
        } else if (this.startProperty instanceof Color) {
            return new Color(
                this.startProperty.r + ((timePast / this.duration) * (this.endProperty.r - this.startProperty.r)),
                this.startProperty.g + ((timePast / this.duration) * (this.endProperty.g - this.startProperty.g)),
                this.startProperty.b + ((timePast / this.duration) * (this.endProperty.b - this.startProperty.b)),
                this.startProperty.a + ((timePast / this.duration) * (this.endProperty.a - this.startProperty.a))
            );
        } else if (this.startProperty instanceof Point) {
            return new Point(
                this.startProperty.x + ((timePast / this.duration) * (this.endProperty.x - this.startProperty.x)),
                this.startProperty.y + ((timePast / this.duration) * (this.endProperty.y - this.startProperty.y)),
            );
        }
    }

    /**
     * Returns whether animation is in progress or not.
     */
    get inProgress() {
        if ((Date.now() - this.startTime) > this.duration) return false;
        return true;
    }
}

//Custom debugging output
console.debug = function () {
    if (!console.debugging) return;
    console.log.apply(this, arguments);
};

//Active pseudo-class mobile compatibility
document.addEventListener("touchstart", function () {}, true);