
class DBSCANClustering {
  // TODO field declaration are not fully supported
  // inputValues = [];
  // minNumElements = 2;
  // epsilon = 1.0;
  // visitedPoints = new Set(); // should be Set
  // metric = (a, b) => 0;

  constructor(inputValues, minNumElements, epsilon, metric) {
    this.inputValues = inputValues;
    this.minNumElements = minNumElements;
    this.epsilon = epsilon;
    this.epsilon2 = Math.pow(epsilon, 2);
    this.metric = metric;
    this.visitedPoints = new Set();
  }

  static mergeRightToLeftCollection(neighbours1, neighbours2) {
    for (let tempPt of neighbours2) {
      if (!neighbours1.includes(tempPt)) {
        neighbours1.push(tempPt);
      }
    }
    return neighbours1;
  }

  getNeighbours(index) {
    let verifyValue2 = this.inputValues[index];
    let neighbours = [];

    for (let i = 0;i < this.inputValues.length;i++) {
      let candidate = this.inputValues[i];
      if (this.metric(verifyValue2, candidate) <= this.epsilon2) {
        neighbours.push(i);
      }
    }
    return neighbours;
  }

  performClustering() {
    let resultList = [];
    this.visitedPoints.clear();

    let neighbours = [];
    this.inputValues.forEach((_, index) => {
      if (this.visitedPoints.has(index)) {
        return;
      }
      this.visitedPoints.add(index);
      let neighbours = this.getNeighbours(index);

      if (neighbours.length < this.minNumElements) {
        return;
      }

      for (let ind = 0;ind < neighbours.length;ind++) {
        let jsonNeighbour = neighbours[ind];
        if (this.visitedPoints.has(jsonNeighbour)) {
          continue;
        }
        this.visitedPoints.add(jsonNeighbour);
        let individualNeighbours = this.getNeighbours(jsonNeighbour);
        if (individualNeighbours.length >= this.minNumElements) {
          neighbours = DBSCANClustering.mergeRightToLeftCollection(
              neighbours, individualNeighbours)
        }
      }
      resultList.push(neighbours)
    });

    return resultList.map(cluster => cluster.map(i => this.inputValues[i]));
  }
}

const euclidean = (v1, v2) => {
  let d0 = v1[0] - v2[0];
  let d1 = v1[1] - v2[1];
  // return Math.sqrt(d0 * d0 + d1 * d1);
  return (d0 * d0 + d1 * d1);
}


self.addEventListener('message', function(e) {
  // console.time("worker");
  let postData = e.data;
  let data = postData.imageData;
  let inputValues = [];
  for (let y = 0;y < e.data.height - 1;y++) {
      let y0 = y * e.data.width;
      for (let x = 0;x < e.data.width - 1;x++) {
          let xx = (y0 + x) * 1;
          let xxx = (y0 + e.data.width + x) * 1;
          data[xx] = parseInt(Math.abs(
              data[xx + 1] - data[xx] + data[xxx] - data[xx] + data[xxx + 1] - data[xx]
          ));
          if (data[xx] > 10.0) {
              inputValues.push([x, y]);
          }
      }
  }

  let dbscan = new DBSCANClustering(inputValues, 3, 1, euclidean);
  let clusters = dbscan.performClustering();
  let foundPoints = [];
  for (let cluster of clusters) {
      let minX = Number.MAX_VALUE;
      let minY = Number.MAX_VALUE;
      let maxX = Number.MIN_VALUE;
      let maxY = Number.MIN_VALUE;
      for (let [ax, ay] of cluster) {
          if (minX > ax) {
              minX = ax;
          }
          if (minY > ay) {
              minY = ay;
          }
          if (maxX < ax) {
              maxX = ax;
          }
          if (maxY < ay) {
              maxY = ay;
          }
      }
      foundPoints.push([minX, minY, maxX, maxY]);
  }
  // console.timeEnd("worker");

  self.postMessage(foundPoints);
}, false);