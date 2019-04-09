class Path {
    constructor(points) {
        this.points = points;
        this.indices = new Uint16Array(points.length * 6);
        this.vertices = [];
        this.previouses = [];
        this.nexts = [];
        this.directions = [];

        //Fill vertices
        points.forEach(point => {
            this.vertices.push(point.x, point.y, point.x, point.y);
        });

        //Fill previouses
        points.forEach((point, i, array) => {
            if (i > 0) i--;

            this.previouses.push(
                array[i].x, array[i].y, array[i].x, array[i].y
            );
        });

        //Fill nexts
        points.forEach((point, i, array) => {
            if (i < array.length-1) i++;

            this.nexts.push(
                array[i].x, array[i].y, array[i].x, array[i].y
            );
        });

        //Fill direction
        points.forEach(point => {
            this.directions.push(-1, 1);
        });

        //Fill indices
        let j = 0;
        let index = 0;
        points.forEach(point => {
            let i = index;
            this.indices[j++] = i + 0;
            this.indices[j++] = i + 1;
            this.indices[j++] = i + 2;
            this.indices[j++] = i + 2;
            this.indices[j++] = i + 1;
            this.indices[j++] = i + 3;
            index += 2;
        });
    }
    
    get length() {
        return (this.points.length - 1) * 6;
    }
}