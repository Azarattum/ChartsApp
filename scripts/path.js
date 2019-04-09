class Path {
    constructor(points) {
        this.normalsData = this.getNormals(points);
    }

    get normals() {
        return this.normalsData.normals;
    }

    get miters() {
        return this.normalsData.miters;
    }

    static getNormals(points) {
        let currentNormal = null;
        let normals = {normals: [], miters: []};

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
                addNext(normals, currentNormal, 1)
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