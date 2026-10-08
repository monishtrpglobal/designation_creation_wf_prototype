"use client";

import { Checkbox as MantineCheckbox } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Checkbox.module.css";

export type CheckboxShape = "square" | "round";
export type CheckboxSize = "sm" | "md";

type CheckboxProps = {
  shape?: CheckboxShape;
  size?: CheckboxSize;
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  error?: boolean;
  onChange?: (checked: boolean) => void;
  value?: string;
  id?: string;
  "aria-label"?: string;
};

export function Checkbox({
  shape = "square",
  size = "md",
  label,
  checked,
  defaultChecked,
  indeterminate,
  disabled,
  error,
  onChange,
  value,
  id,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  return (
    <MantineCheckbox
      id={id}
      value={value}
      aria-label={ariaLabel}
      label={label}
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      disabled={disabled}
      onChange={(event) => onChange?.(event.currentTarget.checked)}
      data-irm-shape={shape}
      data-irm-size={size}
      data-error={error || undefined}
      classNames={{
        root: styles.root,
        body: styles.body,
        inner: styles.inner,
        input: styles.input,
        icon: styles.icon,
        label: styles.label,
      }}
    />
  );
}

type CheckboxGroupProps = {
  label?: ReactNode;
  error?: ReactNode;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  children: ReactNode;
};

export function CheckboxGroup({ label, error, value, defaultValue, onChange, children }: CheckboxGroupProps) {
  return (
    <MantineCheckbox.Group
      label={label}
      error={error}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      classNames={{ root: styles.group, label: styles.legend, error: styles.error }}
    >
      <div className={styles.options}>{children}</div>
    </MantineCheckbox.Group>
  );
}
