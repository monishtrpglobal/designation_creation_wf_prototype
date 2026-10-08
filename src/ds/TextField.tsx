"use client";

import { TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { IconClose, IconInfo, IconSearch } from "./icons";
import { Tooltip } from "./Tooltip";
import styles from "./field.module.css";

export type FieldSize = "sm" | "md";
export type TextFieldType = "default" | "search";

type TextFieldProps = {
  type?: TextFieldType;
  size?: FieldSize;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  tooltip?: ReactNode;
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  id?: string;
};

export function TextField({
  type = "default",
  size = "md",
  label,
  description,
  error,
  tooltip,
  required,
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled,
  readOnly,
  clearable = true,
  id,
}: TextFieldProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = value ?? uncontrolled;
  const showClear = type === "search" && clearable && current.length > 0 && !disabled && !readOnly;

  function update(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  }

  return (
    <TextInput
      id={id}
      variant="unstyled"
      label={
        label ? (
          <span className={styles.labelRow}>
            <span>{label}</span>
            {required ? (
              <span className={styles.asterisk} aria-hidden>
                *
              </span>
            ) : null}
            {tooltip ? (
              <Tooltip label={tooltip}>
                <button type="button" className={styles.info} aria-label="More information">
                  <IconInfo size="s16" />
                </button>
              </Tooltip>
            ) : null}
          </span>
        ) : undefined
      }
      description={description}
      error={error}
      required={required}
      withAsterisk={false}
      placeholder={placeholder}
      value={current}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(event) => update(event.currentTarget.value)}
      onBlur={() => update(current.trim())}
      leftSection={type === "search" ? <IconSearch size={size === "sm" ? "s16" : "s20"} /> : undefined}
      rightSection={
        showClear ? (
          <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => update("")}>
            <IconClose size="s16" />
          </button>
        ) : undefined
      }
      rightSectionPointerEvents={showClear ? "all" : "none"}
      data-irm-type={type}
      data-irm-size={size}
      data-error={error ? true : undefined}
      classNames={{
        root: styles.root,
        wrapper: styles.wrapper,
        label: styles.label,
        input: styles.input,
        section: styles.section,
        description: styles.description,
        error: styles.error,
      }}
    />
  );
}
