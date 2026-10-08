"use client";

import { TagsInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { IconInfo } from "./icons";
import { Tooltip } from "./Tooltip";
import styles from "./field.module.css";

type TagsFieldProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  tooltip?: ReactNode;
  required?: boolean;
  placeholder?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  maxTags?: number;
  id?: string;
};

export function TagsField({
  label,
  description,
  error,
  tooltip,
  required,
  placeholder = "Add tags",
  value,
  defaultValue,
  onChange,
  disabled,
  maxTags,
  id,
}: TagsFieldProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? []);
  const current = value ?? uncontrolled;
  const atMax = maxTags !== undefined && current.length >= maxTags;

  function update(next: string[]) {
    const limited = maxTags === undefined ? next : next.slice(0, maxTags);
    if (value === undefined) setUncontrolled(limited);
    onChange?.(limited);
  }

  return (
    <TagsInput
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
      description={description ?? (atMax ? `Maximum of ${maxTags} tags reached` : undefined)}
      error={error}
      required={required}
      withAsterisk={false}
      placeholder={current.length > 0 ? "" : placeholder}
      value={current}
      onChange={update}
      disabled={disabled}
      data-irm-kind="tags"
      data-error={error ? true : undefined}
      classNames={{
        root: styles.root,
        wrapper: styles.wrapper,
        label: styles.label,
        input: styles.input,
        inputField: styles.inputField,
        description: styles.description,
        error: styles.error,
        pill: styles.pill,
      }}
    />
  );
}
