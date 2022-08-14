import { createGlobalThemeContract } from "@vanilla-extract/css";

const theme = createGlobalThemeContract({
  color: {
    background: "color-background",
    foreground: "color-foreground",
    subtle: "color-subtle",
  },
});

export default theme;
