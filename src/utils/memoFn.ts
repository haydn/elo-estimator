const NOT_SET: unique symbol = Symbol();

const memoFn = <T>(
  fn: () => T,
  isEqual: (previous: T, updated: T) => boolean
) => {
  let memoizedValue: T | typeof NOT_SET = NOT_SET;

  return () => {
    const newValue = fn();

    if (memoizedValue === NOT_SET || !isEqual(memoizedValue, newValue)) {
      memoizedValue = newValue;
    }

    return memoizedValue;
  };
};

export default memoFn;
