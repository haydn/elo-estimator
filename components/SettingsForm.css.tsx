import { style } from "@vanilla-extract/css";

export const form = style({
  display: "grid",
  gap: 10,
  maxWidth: "80em"
});

export const field = style({
  display: "grid",
  gap: 5,
});

export const footer = style({
  display: "grid",
  justifyContent: "flex-end"
});
