class Path {
    static get EPSILON() {
        return 0.0001;
    }

    static getSignedArea(point1, point2, point3) {
        return (point2.x - point1.x) * (point3.y - point1.y) -
            (point3.x - point1.x) * (point2.y - point1.y);
    }

    static getIntersectionPoint(point1, point2, point3, point4) {
        const a0 = point2.y - point1.y;
        const b0 = point1.x - point2.x;

        const a1 = point4.y - point3.y;
        const b1 = point3.x - point4.x;

        const det = a0 * b1 - a1 * b0;
        if (det > -this.EPSILON && det < this.EPSILON) {
            return null;
        } else {
            const c0 = a0 * point1.x + b0 * point1.y;
            const c1 = a1 * point3.x + b1 * point3.y;

            const x = (b1 * c0 - b0 * c1) / det;
            const y = (a0 * c1 - a1 * c0) / det;
            return new Point(x, y);
        }
    }

    static getTriangles(point1, point2, point3, width, isFirst = false) {        
        let t0 = point2.subtract(point1).normal();
        let t1 = point3.subtract(point2).normal();

        if (this.getSignedArea(point1, point2, point3) > 0) {
            t0 = t0.invert();
            t1 = t1.invert();
        }

        t0 = t0.normalize();
        t1 = t1.normalize();
        t0 = t0.expand(width);
        t1 = t1.expand(width);

        const intersectionPoint = this.getIntersectionPoint(
            t0.add(point1), t0.add(point2), t1.add(point3), t1.add(point2)
        );

        const anchor = intersectionPoint? intersectionPoint.subtract(point2) : null;
        const anchorLength = anchor? anchor.length : Number.MAX_VALUE;
        
        const point12 = point1.subtract(point2);
        const point23 = point2.subtract(point3);

        let vertices = [];
        if (anchorLength > point12.length || anchorLength > point23.length) {
            if (isFirst) {
                vertices.push(point1.add(t0));
                vertices.push(point1.subtract(t0));
                vertices.push(point2.add(t0));

                vertices.push(point1.subtract(t0));
                vertices.push(point2.add(t0));
                vertices.push(point2.subtract(t0));
            }

            if (((anchorLength / width) | 0) < 10 && intersectionPoint) {
                vertices.push(point2.add(t0));
                vertices.push(point2);
                vertices.push(intersectionPoint);

                vertices.push(point2.add(t1));
                vertices.push(point2);
                vertices.push(intersectionPoint);
            }

            vertices.push(point3.add(t1));
            vertices.push(point2.subtract(t1));
            vertices.push(point2.add(t1));

            vertices.push(point3.add(t1));
            vertices.push(point2.subtract(t1));
            vertices.push(point3.subtract(t1));
        } else {
            if (isFirst) {
                vertices.push(point1.add(t0));
                vertices.push(point1.subtract(t0));
                vertices.push(point2.subtract(anchor));

                vertices.push(point1.add(t0));
                vertices.push(point2.subtract(anchor));
                vertices.push(point2.add(t0));
            }

            vertices.push(point2.add(t0));
            vertices.push(point2.add(t1));
            vertices.push(point2.subtract(anchor));

            if (((anchorLength / width) | 0) >= 10) {
                vertices.push(intersectionPoint);
                vertices.push(point2.add(t0));
                vertices.push(point2.add(t1));
            }

            vertices.push(point3.add(t1));
            vertices.push(point2.subtract(anchor));
            vertices.push(point2.add(t1));

            vertices.push(point3.add(t1));
            vertices.push(point2.subtract(anchor));
            vertices.push(point3.subtract(t1));
        }
        return vertices;
    }

    static getVertices(points, width, viewport) {
        let vertices = [];
        for (let i = 1; i < points.length - 1; i++) {
            if (i == 1) {
                points[i - 1].x = (points[i - 1].x + 1) / 2 * viewport.width;
                points[i - 1].y = (points[i - 1].y + 1) / 2 * viewport.height;
                points[i].x = (points[i].x + 1) / 2 * viewport.width;
                points[i].y = (points[i].y + 1) / 2 * viewport.height;
            }
            points[i + 1].x = (points[i + 1].x + 1) / 2 * viewport.width;
            points[i + 1].y = (points[i + 1].y + 1) / 2 * viewport.height;

            let triangles = this.getTriangles(
                points[i - 1], 
                points[i], 
                points[i + 1], 
                width,
                i == 1
            );
            
            for (const vertex of triangles) {
                vertices.push(vertex.x / viewport.width * 2 - 1);
                vertices.push(vertex.y / viewport.height * 2 - 1);
            }
        }

        return vertices;
    }
}