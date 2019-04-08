class GL {
    /**
     * Creates GL object.
     * @param {Element} canvas Canvas element.
     * @param {ShadersProgram} program Vertex & Fragment shaders program.
     */
    constructor(canvas, program) {
        //GL Initializing
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", {
            alpha: false,
            premultipliedAlpha: false
        }) || canvas.getContext("experimental-webgl", {
            alpha: false,
            premultipliedAlpha: false
        }) || canvas.getContext("moz-webgl", {
            alpha: false,
            premultipliedAlpha: false
        }) || canvas.getContext("webkit-3d", {
            alpha: false,
            premultipliedAlpha: false
        });

        this.attributes = [];
        this.attribute = new Proxy(this.attributes, {
            set: (obj, name, value) => {
                let attribute = this.attributes.find(x => x.name == name);
                let type = this.program.attributes[name];
                if (type == undefined) {
                    console.warn(new Error("Attribute " + name + " does not exist in shader program!"));
                    return;
                }
                if (attribute != undefined) {
                    attribute.update(value);
                } else {
                    this.attributes.push(new Attrubute(this.gl, program.program, type, name, value));
                }
            },
            get: (obj, name) => {
                let attribute = this.attributes.find(x => x.name == name);
                if (attribute == undefined) return undefined;
                return attribute.value;
            }
        });

        this.uniforms = [];
        this.uniform = new Proxy(this.uniforms, {
            set: (obj, name, value) => {
                let uniform = this.uniforms.find(x => x.name == name);
                let type = this.program.uniforms[name];
                if (type == undefined) {
                    console.warn(new Error("Uniform " + name + " does not exist in shader program!"));
                    return;
                }
                if (uniform != undefined) {
                    uniform.update(value);
                } else {
                    this.uniforms.push(new Uniform(this.gl, program.program, type, name, value));
                }
            },
            get: (obj, name) => {
                let uniform = this.uniforms.find(x => x.name == name);
                if (uniform == undefined) return undefined;
                return uniform.value;
            }
        });

        this.program = program;
        this.program.attach(this.gl);
        this.program.use();

        this.gl.clearColor(0., 0., 0., 0.);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA,
            this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

        this.resize();
    }

    set background(color) {
        color = color.toArray();
        this.gl.clearColor(color[0], color[1], color[2], color[3]);
    }

    resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight) {
        this.viewport = {
            width: width * window.devicePixelRatio,
            height: height * window.devicePixelRatio
        }
        this.canvas.width = this.viewport.width;
        this.canvas.height = this.viewport.height;
        this.gl.viewport(0, 0, this.viewport.width, this.viewport.height);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawStrip(count, offset = 0) {
        this.gl.drawArrays(this.gl.LINE_STRIP, offset, count - offset);
    }

    drawTriangles(count, offset = 0) {
        this.gl.drawArrays(this.gl.TRIANGLES, offset, count - offset);
    }

    drawShape(count, offset = 0) {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, count - offset);
        let gl = this.gl;
    }
}

class Attrubute {
    constructor(gl, program, type, name, value) {
        this.gl = gl;
        this.type = type;
        this.buffer = gl.createBuffer();
        this.name = name;
        this.value = value;

        let pointerSize, pointerType;
        switch (type) {
            case gl.FLOAT:
                pointerSize = 1;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_VEC2:
                pointerSize = 2;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_VEC3:
                pointerSize = 3;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_VEC4:
                pointerSize = 4;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_MAT2:
                pointerSize = 2;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_MAT3:
                pointerSize = 3;
                pointerType = gl.FLOAT;
                break;
            case gl.FLOAT_MAT4:
                pointerSize = 4;
                pointerType = gl.FLOAT;
                break;

            default:
                throw new Error("Unknown attribute type " + type + "!");
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(value), gl.STATIC_DRAW);
        let location = gl.getAttribLocation(program, name);
        gl.vertexAttribPointer(location, pointerSize, pointerType, false, 0, 0);
        gl.enableVertexAttribArray(location);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    update(value) {
        this.value = value;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(value), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
}

class Uniform {
    constructor(gl, program, type, name, value) {
        this.gl = gl;
        this.name = name;
        this.value = value;
        this.location = gl.getUniformLocation(program, name);
        switch (type) {
            case gl.FLOAT:
                this.function = this.gl.uniform1fv;
                break;
            case gl.FLOAT_VEC2:
                this.function = gl.uniform2fv;
                break;
            case gl.FLOAT_VEC3:
                this.function = gl.uniform3fv;
                break;
            case gl.FLOAT_VEC4:
                this.function = gl.uniform4fv;
                break;
            case gl.FLOAT_MAT2:
                this.function = (location, value) => {
                    gl.uniformMatrix2fv(location, false, value);
                };
                break;
            case gl.FLOAT_MAT3:
                this.function = (location, value) => {
                    gl.uniformMatrix3fv(location, false, value);
                };
                break;
            case gl.FLOAT_MAT4:
                this.function = (location, value) => {
                    gl.uniformMatrix4fv(location, false, value);
                };
                break;
            case gl.INT:
                this.function = gl.uniform1iv;
                break;
            case gl.INT_VEC2:
                this.function = gl.uniform2iv;
                break;
            case gl.INT_VEC3:
                this.function = gl.uniform3iv;
                break;
            case gl.INT_VEC4:
                this.function = gl.uniform4iv;
                break;
            case gl.SAMPLER_2D:
                this.function = gl.uniform1iv;
                break;
            case gl.SAMPLER_CUBE:
                this.function = gl.uniform1iv;
                break;
            case gl.BOOL:
                this.function = gl.uniform1iv;
                break;
            case gl.BOOL_VEC2:
                this.function = gl.uniform2iv;
                break;
            case gl.BOOL_VEC3:
                this.function = gl.uniform3iv;
                break;
            case gl.BOOL_VEC4:
                this.function = gl.uniform4iv;
                break;

            default:
                throw new Error("Unknown uniform type " + type + "!");
        }

        this.update(value);
    }

    update(value) {
        this.value = value;

        if (!Array.isArray(value)) {
            value = [value];
        }
        this.function.call(this.gl, this.location, value);
    }
}

class Shader {
    constructor(code, type) {
        this.code = code;
        this.type = type;
        this.shader = null;
        this.gl = null;
        this.program = null;

        this._changed = false;
    }

    attach(gl, program) {
        this.gl = gl;
        this.program = program;

        this.compile();
        gl.attachShader(program, this.shader);
    }

    update() {
        if (this.gl == null || this, program == null) {
            throw new Error("Shader is not attached!");
        }

        this.compile();
        this.gl.linkProgram(this.program);
    }

    compile() {
        if (this.shader != null && !this._changed) return;
        if (this.gl == null) {
            throw new Error("Shader is not attached!");
        }

        this.shader = this.gl.createShader(this.type);
        this.gl.shaderSource(this.shader, this.code);
        this.gl.compileShader(this.shader);
    }

    static get types() {
        return Object.freeze({
            "VERTEX": WebGLRenderingContext.VERTEX_SHADER,
            "FRAGMENT": WebGLRenderingContext.FRAGMENT_SHADER
        });
    }
}

class ShadersProgram {
    constructor(vertex, fragment) {
        this.attributes = [];
        this.uniforms = [];
        this.vertex = vertex;
        this.fragment = fragment;
        this.gl = null;
        this.program = null;
    }

    attach(gl) {
        if (this.gl == gl) return;
        this.gl = gl;
        this.program = gl.createProgram();
        this.vertex.attach(gl, this.program);
        this.fragment.attach(gl, this.program);

        gl.linkProgram(this.program);

        this.attributes = [];
        let attributesCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attributesCount; i++) {
            let attribute = gl.getActiveAttrib(this.program, i);
            this.attributes[attribute.name] = attribute.type;
        }

        this.uniforms = [];
        let uniformsCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformsCount; i++) {
            let uniform = gl.getActiveUniform(this.program, i);
            this.uniforms[uniform.name.replace(/[[][0-9]+]$/g, "")] = uniform.type;
        }
    }

    use() {
        if (this.gl == null) {
            throw new Error("Program is not attached!");
        }

        this.gl.useProgram(this.program);
    }
}