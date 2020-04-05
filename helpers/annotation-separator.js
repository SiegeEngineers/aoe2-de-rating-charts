/**
 * Best effort algorithm for preventing plotly annotations from overlaping
 */

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

const MAX_ITERATIONS = 100;
const LOGGING = false;

class AnnotationSeparator {
  constructor(
    inputAnnotations,
    minX,
    maxX,
    minY,
    maxY,
    annotationWidth,
    annotationHeight
  ) {
    this.inputAnnotations = inputAnnotations;

    this.minX = minX;
    this.maxX = maxX - annotationWidth / 2;
    this.rangeX = this.maxX - this.minX;

    this.minY = minY;
    this.maxY = maxY;
    this.rangeY = maxY - minY;

    this.numberOfXPartitions = Math.trunc(this.rangeX / annotationWidth);
    this.numberOfYPartitions = Math.trunc(this.rangeY / annotationHeight);

    this.annotationWidth = annotationWidth;
    this.annotationHeight = annotationHeight;

    this.usedIndexes = new Set();
  }

  getClosestPartitionIndex(value, min, max, numberOfPartitions) {
    let normValue = value - min;
    let range = max - min;
    let percentage = normValue / range;
    let index = percentage * numberOfPartitions;
    return Math.round(index);
  }

  getCoordinatesFromPartitionIndex(index, min, granularity) {
    return min + index * granularity;
  }

  // Not idempotent
  calculateAndReserveNearestValidPartitionIndex(
    xindex,
    yindex,
    annotation,
    annotations
  ) {
    let startingX = xindex;
    let startingY = yindex;
    let generator = this.getNextNearestPartitionIndexes(
      startingX,
      startingY,
      0,
      0,
      this.numberOfXPartitions,
      this.numberOfYPartitions
    );
    let iterations = 0;
    let active = null;
    let activeStringRepresentation = null;

    while (iterations < MAX_ITERATIONS) {
      active = generator.next().value;
      if (active == null) {
        return null;
      }
      activeStringRepresentation = JSON.stringify(active);

      // Not too close to data point
      let arrowXCoord = this.getCoordinatesFromPartitionIndex(
        active.x,
        this.minX,
        this.annotationWidth
      );
      let arrowYCoord = this.getCoordinatesFromPartitionIndex(
        active.y,
        this.minY,
        this.annotationHeight
      );
      let selfDistance = Math.sqrt(
        Math.pow(annotation.x - arrowXCoord, 2) +
          Math.pow(annotation.y - arrowYCoord, 2)
      );
      const MIN_DISTANCE_TO_OWN_DATA_POINTS = this.annotationHeight;
      if (selfDistance < MIN_DISTANCE_TO_OWN_DATA_POINTS) {
        if (LOGGING) {
          console.log("REJECTED: too close to own data point ", selfDistance);
        }
        iterations++;
        continue;
      }

      // Not taken by another annotation
      if (this.usedIndexes.has(activeStringRepresentation)) {
        if (LOGGING) {
          console.log(
            "REJECTED: overlaping annotation ",
            activeStringRepresentation
          );
        }
        iterations++;
        continue;
      }

      // Not too close to any other datapoint
      let overlapingDataPoint = false;
      for (let i = 0; i < annotations.length; i++) {
        let otherAnnotation = annotations[i];
        let distance = Math.sqrt(
          Math.pow(otherAnnotation.x - arrowXCoord, 2) +
            Math.pow(otherAnnotation.y - arrowYCoord, 2)
        );
        const MIN_DISTANCE_TO_OTHER_DATA_POINTS = this.annotationWidth / 2;
        if (distance < MIN_DISTANCE_TO_OTHER_DATA_POINTS) {
          if (LOGGING) {
            console.log("REJECTED: overlaping datapoint", otherAnnotation.text);
          }
          iterations++;
          overlapingDataPoint = true;
          break;
        }
      }
      if (overlapingDataPoint) {
        continue;
      }

      // No problems with these indexes!
      break;
    }

    this.usedIndexes.add(activeStringRepresentation);
    if (LOGGING) {
      console.log(
        "SUCCESS! Finished with ",
        iterations,
        "iterations",
        activeStringRepresentation
      );
    }

    return {
      x: active.x,
      y: active.y
    };
  }

  // This generator function is an implementation of breath first search
  *getNextNearestPartitionIndexes(indexX, indexY, xmin, ymin, xmax, ymax) {
    let queue = [{ x: indexX, y: indexY }];

    let visited = new Set();
    visited.add(JSON.stringify(queue[0]));
    while (true) {
      // Get the first element form the queue
      if (queue.length === 0) {
        console.log("No more valid locations to search");
        return null;
      }
      let active = queue.shift();

      // Determine our neighbors
      let toAdd = [
        { x: active.x + 1, y: active.y },
        { x: active.x - 1, y: active.y },
        { x: active.x, y: active.y + 1 },
        { x: active.x, y: active.y - 1 }
      ];

      for (let i = 0; i < toAdd.length; i++) {
        let neighbor = toAdd[i];
        let neighborStringRepresentation = JSON.stringify(toAdd[i]);
        // Add the neighbor the the queue if we haven't visited it already AND they are in the valid range
        if (!visited.has(neighborStringRepresentation)) {
          if (
            neighbor.x >= xmin &&
            neighbor.x <= xmax &&
            neighbor.y >= ymin &&
            neighbor.y <= ymax
          ) {
            visited.add(neighborStringRepresentation);
            queue.push(neighbor);
          }
        }
      }
      yield active;
    }
  }

  doesPointIntersectRectable(point, rectangle) {
    let pointX = point.x;
    let pointY = point.y;
    let left = rectangle.left;
    let right = rectangle.right;
    let top = rectangle.top;
    let bottom = rectangle.bottom;
    return (
      pointX <= right && pointX >= left && pointY >= bottom && pointY <= top
    );
  }

  getSeparatedAnnotations() {
    // Adjust annotations so their locations meet our defined criteria
    for (let i = 0; i < this.inputAnnotations.length; i++) {
      let annotation = this.inputAnnotations[i];

      // Get the closest annotation slot to the data point
      let newXindex = this.getClosestPartitionIndex(
        annotation.ax,
        this.minX,
        this.maxX,
        this.numberOfXPartitions
      );
      let newYindex = this.getClosestPartitionIndex(
        annotation.ay,
        this.minY,
        this.maxY,
        this.numberOfYPartitions
      );

      let adjusted = this.calculateAndReserveNearestValidPartitionIndex(
        newXindex,
        newYindex,
        annotation,
        this.inputAnnotations
      );
      // Null means we were unable to find a satisfctory place for the annotation, just leave it wherever
      if (adjusted !== null) {
        newXindex = adjusted.x;
        newYindex = adjusted.y;

        // Translate indexes to coordinates
        let newX = this.getCoordinatesFromPartitionIndex(
          newXindex,
          this.minX,
          this.annotationWidth
        );
        let newY = this.getCoordinatesFromPartitionIndex(
          newYindex,
          this.minY,
          this.annotationHeight
        );

        annotation.ax = newX;
        annotation.ay = newY;
      }
    }

    return this.inputAnnotations;
  }
}

export default AnnotationSeparator;
