import { style } from "@vanilla-extract/css";

export const container = style({
  position: "relative",
});

export const nav = style({
  position: "fixed",
  rowGap: 10,
  display: "grid",
  gridAutoFlow: "row",
  padding: 10,
});

export const content = style({
  position: "relative",
  marginLeft: "10rem",
  padding: 10,
});
