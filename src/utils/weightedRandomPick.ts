const weightedRandomPick = <T extends any>(
  items: Array<T>,
  weighting: number
): T => items[Math.floor(Math.pow(Math.random(), weighting) * items.length)];

export default weightedRandomPick;
