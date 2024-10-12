import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
};

let root: HTMLDivElement;

if (typeof document !== "undefined") {
  root = document.createElement("div");
  document.body.appendChild(root);
}

const Layer = ({ children }: Props) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!root) throw Error("<Layer> Unable to find root element.");

    const e = document.createElement("div");

    e.style.setProperty("inset", "0");
    e.style.setProperty("position", "fixed");
    e.style.setProperty("z-index", "1");

    root.appendChild(e);

    setElement(e);

    return () => {
      root.removeChild(e);
    };
  }, []);

  return element ? createPortal(children, element) : null;
};

export default Layer;
