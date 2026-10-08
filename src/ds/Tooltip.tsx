"use client";

import type { ReactNode } from "react";
import { Tooltip as MantineTooltip } from "@mantine/core";
import styles from "./Tooltip.module.css";

export type TooltipWidth = "default" | "wide" | "single-line";
export type TooltipPosition = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  label: ReactNode;
  children: ReactNode;
  width?: TooltipWidth;
  position?: TooltipPosition;
  withArrow?: boolean;
  opened?: boolean;
};

export function Tooltip({
  label,
  children,
  width = "default",
  position = "top",
  withArrow = false,
  opened,
}: TooltipProps) {
  return (
    <MantineTooltip
      label={label}
      position={position}
      withArrow={withArrow}
      opened={opened}
      multiline={width !== "single-line"}
      events={{ hover: true, focus: true, touch: false }}
      classNames={{ tooltip: styles.tooltip, arrow: styles.arrow }}
      data-irm-width={width}
      styles={{
        tooltip: {
          maxWidth:
            width === "wide"
              ? "var(--size-tooltip-max-width-wide)"
              : width === "default"
                ? "var(--size-tooltip-max-width)"
                : "none",
        },
      }}
    >
      {children}
    </MantineTooltip>
  );
}
