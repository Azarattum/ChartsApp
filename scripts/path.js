class Path {
    constructor(points) {
        this.data = Path.getNormals(points);
        this.data.points = points;

        this.values = {
            points: [],
            normals: [],
            miters: [],
            indices: []
        }

        this.data.points.forEach(point => {
            this.values.points.push(point.x, point.y, point.x, point.y);
        });

        this.data.normals.forEach(normal => {
            this.values.normals.push(normal.x, normal.y, normal.x, normal.y);
        });

        this.data.miters.forEach(miter => {
            this.values.miters.push(-miter, miter);
        });

        this.values.indices = new Uint16Array(points.length * 6);
        let c = 0;
        let index = 0;
        for (let j = 0; j < points.length; j++) {
            let i = index;
            this.values.indices[c++] = i + 0;
            this.values.indices[c++] = i + 1;
            this.values.indices[c++] = i + 2;
            this.values.indices[c++] = i + 2;
            this.values.indices[c++] = i + 1;
            this.values.indices[c++] = i + 3;
            index += 2;
        }
    }

    get normals() {
        return this.values.normals;
    }

    get miters() {
        return this.values.miters;
    }

    get vertices() {
        return this.values.points;
    }

    get indices() {
        return this.values.indices;
    }
    
    get length() {
        return (this.data.points.length - 1) * 6;
    }

    static getNormals(points) {
        let currentNormal = null;
        let normals = {
            normals: [],
            miters: []
        };

        for (let i = 1; i < points.length; i++) {
            let last = points[i - 1];
            let current = points[i];
            let next = i < points.length - 1 ? points[i + 1] : null;

            let line = current.subtract(last).normalize();
            if (!currentNormal) {
                currentNormal = line.normal();
            }

            //Initial normals
            if (i === 1) {
                normals.normals.push(currentNormal);
                normals.miters.push(1);
            }

            //No miter if simple segment
            if (!next) {
                currentNormal = line.normal();
                normals.normals.push(currentNormal);
                normals.miters.push(1);
            } else {
                //Next line
                let nextLine = next.subtract(current).normalize();

                //Compute miter
                let normal = line.add(nextLine).normalize().normal();
                let tmp = line.normal();

                let miter = 1 / normal.dot(tmp);

                normals.normals.push(normal);
                normals.miters.push(miter);
            }
        }

        return normals;
    }
}