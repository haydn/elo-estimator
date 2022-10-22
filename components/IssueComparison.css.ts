import { style } from "@vanilla-extract/css";
import theme from "../utils/theme.css";

export const header = style({
  textAlign: "center",
  borderBottom: `1px solid ${theme.color.background}`,
});

export const main = style({
  alignItems: "start",
  columnGap: 20,
  display: "grid",
  gridAutoColumns: "minmax(0, 1fr)",
  gridAutoFlow: "column",
  padding: "20px 20px 150px",
  rowGap: 20,
});

export const footer = style({
  background: theme.color.background,
  bottom: 0,
  left: "10rem",
  padding: "30px 0",
  position: "fixed",
  right: 0,
  rowGap: 20,
  display: "grid",
});

export const buttons = style({
  columnGap: 20,
  display: "grid",
  gridAutoColumns: "minmax(0, 1fr)",
  gridAutoFlow: "column",
  justifyItems: "center",
});

export const submit = style({
  display: "grid",
  placeItems: "center",
  gridAutoFlow: "column",
  columnGap: 20,
  justifyContent: "center",
});
