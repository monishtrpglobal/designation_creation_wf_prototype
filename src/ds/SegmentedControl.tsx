"use client";

import { SegmentedControl as MantineSegmentedControl } from "@mantine/core";
import styles from "./SegmentedControl.module.css";

export type SegmentedControlSize = "sm" | "md";
export type SegmentedControlOrientation = "horizontal" | "vertical";

export type SegmentedControlItem = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  data: SegmentedControlItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: SegmentedControlSize;
  orientation?: SegmentedControlOrientation;
  fullWidth?: boolean;
  "aria-label"?: string;
};

export function SegmentedControl({
  data,
  value,
  defaultValue,
  onChange,
  size = "sm",
  orientation = "horizontal",
  fullWidth = false,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <MantineSegmentedControl
      data={data}
      value={value}
      defaultValue={defaultValue ?? data[0]?.value}
      onChange={onChange}
      orientation={orientation}
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      withItemsBorders={false}
      data-irm-size={size}
      classNames={{
        root: styles.root,
        indicator: styles.indicator,
        label: styles.label,
        control: styles.control,
      }}
    />
  );
}
