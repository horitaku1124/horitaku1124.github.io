export class ImageResize {
  static monoColor(imageData) {
    let newData = new Uint8ClampedArray(imageData.length / 4);
    let data = imageData;
    for (let i = 0; i < newData.length; i++) {
      let index = i * 4;
      newData[i] = (data[index] + data[index +1] + data[index +2]) / 3;
    }
    return newData;
  }
  static maxPoolingMono(imageData, oldWidth, oldHeight, scale) {
    let newData = new Uint8ClampedArray(imageData.length / scale / scale);

    let hLimit = oldHeight - scale + 1;
    let wLimit = oldWidth - scale + 1;
    let index = 0;
    for (let y = 0;y < hLimit;y += scale) {
      for (let x = 0; x < wLimit; x += scale) {
        let values = [];
        for (let x2 = 0;x2 < scale;x2++) {
          for (let y2 = 0;y2 < scale;y2++) {
            values.push(imageData[(y + y2) * oldWidth + x + x2]);
          }
        }
        newData[index] = Math.max.apply(null, values);
        index++;
      }
    }
    return newData;
  }
}