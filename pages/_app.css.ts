import { style, globalStyle } from "@vanilla-extract/css";
import theme from "../utils/theme.css";

globalStyle(":root", {
  vars: {
    [theme.color.background]: "#eee",
    [theme.color.foreground]: "#000",
    [theme.color.subtle]: "#666",
  },
  colorScheme: "light dark",
  "@media": {
    "(prefers-color-scheme: dark)": {
      vars: {
        [theme.color.background]: "#000",
        [theme.color.foreground]: "#eee",
        [theme.color.subtle]: "#333",
      },
    },
  },
});

globalStyle("body", {
  fontFamily: "sans-serif",
  fontSize: 14,
  margin: 0,
});

globalStyle("img", {
  maxWidth: "100%",
});

globalStyle("th, td", {
  padding: "0.1em 0.5em",
  textAlign: "left",
});

export const container = style({
  display: "grid",
  placeContent: "center",
  height: "100vh"
});
