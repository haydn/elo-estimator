import { style } from "@vanilla-extract/css";
import theme from "../utils/theme.css";

export const header = style({
  textAlign: "center",
  borderBottom: `1px solid ${theme.color.background}`,
});

export const main = style({
  columnGap: 20,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  padding: "20px 20px 150px",
  rowGap: 20,
});

export const footer = style({
  background: theme.color.background,
  bottom: 0,
  columnGap: 20,
  display: "grid",
  gridAutoFlow: "column",
  gridTemplateColumns: "1fr 1fr 1fr",
  justifyItems: "center",
  left: "10rem",
  padding: "50px 0",
  position: "fixed",
  right: 0,
});
