import { Badge as MantineBadge } from "@mantine/core";
import type { BadgeProps as MantineBadgeProps } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";

export type BadgeVariant =
  | "light"
  | "filled"
  | "outline"
  | "dot"
  | "completed"
  | "in-progress"
  | "pending"
  | "error"
  | "warning"
  | "info";

export type BadgeSize = "sm" | "md";

type BadgeProps = Omit<MantineBadgeProps, "variant" | "size" | "color" | "children" | "styles"> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
};

const sizeStyle: Record<BadgeSize, CSSProperties> = {
  sm: {
    height: "var(--space-s20)",
    padding: "var(--space-s2) var(--space-s6)",
  },
  md: {
    height: "var(--space-s24)",
    padding: "var(--space-s4) var(--space-s8)",
  },
};

const pill = new Set<BadgeVariant>(["light", "filled", "outline", "dot"]);

const skin: Record<BadgeVariant, CSSProperties> = {
  light: {
    backgroundColor: "var(--color-brand-teal-soft)",
    color: "var(--color-sea-8)",
    border: "none",
  },
  filled: {
    backgroundColor: "var(--color-sea-8)",
    color: "var(--color-text-inverse)",
    border: "none",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--color-sea-8)",
    border: "var(--border-default) solid var(--color-sea-8)",
  },
  dot: {
    backgroundColor: "transparent",
    color: "var(--color-text-strong)",
    border: "var(--border-default) solid var(--color-border-input)",
  },
  completed: {
    backgroundColor: "var(--color-success-bg)",
    color: "var(--color-success-text)",
    border: "var(--border-default) solid var(--color-success-border)",
  },
  "in-progress": {
    backgroundColor: "var(--color-in-progress-bg)",
    color: "var(--color-in-progress-text)",
    border: "none",
  },
  pending: {
    backgroundColor: "var(--color-neutral-bg)",
    color: "var(--color-neutral-text)",
    border: "var(--border-default) solid var(--color-neutral-border)",
  },
  error: {
    backgroundColor: "var(--color-error-bg)",
    color: "var(--color-error-text)",
    border: "var(--border-default) solid var(--color-error-border)",
  },
  warning: {
    backgroundColor: "var(--color-warning-bg)",
    color: "var(--color-warning-text)",
    border: "var(--border-default) solid var(--color-warning-border)",
  },
  info: {
    backgroundColor: "var(--color-info-bg)",
    color: "var(--color-info-text)",
    border: "var(--border-default) solid var(--color-info-border-subtle)",
  },
};

export function Badge({ variant = "light", size = "md", children, ...rest }: BadgeProps) {
  return (
    <MantineBadge
      {...rest}
      variant="transparent"
      leftSection={
        variant === "dot" ? (
          <span
            aria-hidden
            style={{
              display: "block",
              width: "var(--space-s6)",
              height: "var(--space-s6)",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-brand-teal)",
            }}
          />
        ) : undefined
      }
      styles={{
        root: {
          ...sizeStyle[size],
          ...skin[variant],
          gap: "var(--space-s4)",
          borderRadius: pill.has(variant) ? "var(--radius-full)" : "var(--radius-s20)",
          boxSizing: "border-box",
          textTransform: "none",
          fontFamily: "var(--font-family-lato-semibold)",
          fontSize: "var(--font-size-l3)",
          fontWeight: "var(--font-weight-control-sm)",
          lineHeight: "var(--font-line-height-control-sm)",
        },
        label: {
          fontFamily: "var(--font-family-lato-semibold)",
          fontSize: "var(--font-size-l3)",
          fontWeight: "var(--font-weight-control-sm)",
          lineHeight: "var(--font-line-height-control-sm)",
          textTransform: "none",
        },
        section: {
          margin: 0,
        },
      }}
    >
      {children}
    </MantineBadge>
  );
}
