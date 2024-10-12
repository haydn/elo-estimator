import { useCallback, useEffect, useState } from "react";

export const useLocalStorage = <T extends string>(key: string) => {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const storedValue = window?.localStorage.getItem(key);
    setValue(storedValue === null ? undefined : (storedValue as T));
  }, [key]);

  const update = useCallback(
    (newValue: T | undefined) => {
      if (newValue === undefined) {
        window?.localStorage.removeItem(key);
      } else {
        window?.localStorage.setItem(key, newValue);
      }
      setValue(newValue);
    },
    [key]
  );

  return [value, update] as const;
};
