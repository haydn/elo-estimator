import { style } from "@vanilla-extract/css";
import theme from "../utils/theme.css";

export const container = style({
  border: `1px solid ${theme.color.background}`,
  borderRadius: 20,
  padding: 20,
});
