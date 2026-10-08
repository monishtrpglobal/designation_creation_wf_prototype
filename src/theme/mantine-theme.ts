import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "var(--font-family-lato-regular), sans-serif",
  defaultRadius: "md",
  radius: {
    xs: "var(--radius-mantine-xs)",
    sm: "var(--radius-mantine-sm)",
    md: "var(--radius-mantine-md)",
    lg: "var(--radius-mantine-lg)",
    xl: "var(--radius-mantine-xl)",
  },
  spacing: {
    xs: "var(--gutter-xs)",
    sm: "var(--gutter-sm)",
    md: "var(--gutter-md)",
    lg: "var(--gutter-lg)",
    xl: "var(--gutter-xl)",
    s0: "var(--space-s0)",
    s2: "var(--space-s2)",
    s4: "var(--space-s4)",
    s6: "var(--space-s6)",
    s8: "var(--space-s8)",
    s10: "var(--space-s10)",
    s12: "var(--space-s12)",
    s16: "var(--space-s16)",
    s20: "var(--space-s20)",
    s24: "var(--space-s24)",
    s32: "var(--space-s32)",
    s40: "var(--space-s40)",
    s48: "var(--space-s48)",
    s56: "var(--space-s56)",
    s64: "var(--space-s64)",
    s72: "var(--space-s72)",
    s80: "var(--space-s80)",
    s96: "var(--space-s96)",
  },
  headings: {
    fontFamily: "var(--font-family-inter-display-semibold), sans-serif",
    fontWeight: "var(--font-weight-heading-h2)",
    sizes: {
      h1: {
        fontSize: "var(--font-size-heading-h1)",
        lineHeight: "var(--font-line-height-heading-h1)",
        fontWeight: "var(--font-weight-heading-h1)",
      },
      h2: {
        fontSize: "var(--font-size-heading-h2)",
        lineHeight: "var(--font-line-height-heading-h2)",
        fontWeight: "var(--font-weight-heading-h2)",
      },
    },
  },
});
