const ratingToEstimate = (
  rating: number,
  min: number,
  max: number,
  rates: Array<number>
) => {
  const step = (max - min) / rates.length;
  let index = rates.length - 1;
  while (index > 0 && rating > max - step * index) {
    index -= 1;
  }
  return rates[index];
};

export default ratingToEstimate;
