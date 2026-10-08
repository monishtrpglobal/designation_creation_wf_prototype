"use client";

import { Textarea } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { IconAlertCircle, IconInfo } from "./icons";
import { Tooltip } from "./Tooltip";
import styles from "./field.module.css";

type TextAreaProps = {
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
  showCounter?: boolean;
  maxLength?: number;
  id?: string;
};

export function TextArea({
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
  showCounter = false,
  maxLength,
  id,
}: TextAreaProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = value ?? uncontrolled;
  const overLimit = maxLength !== undefined && current.length > maxLength;

  function update(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  }

  return (
    <div className={styles.stack}>
      <Textarea
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
        data-error={error ? true : undefined}
        classNames={{
          root: styles.root,
          wrapper: styles.wrapper,
          label: styles.label,
          input: `${styles.input} ${styles.area}`,
          description: styles.description,
          error: styles.error,
        }}
      />
      {showCounter && maxLength !== undefined ? (
        <div className={styles.counter} data-over={overLimit || undefined}>
          {overLimit ? <IconAlertCircle size="s14" /> : null}
          <span>
            {current.length} / {maxLength}
          </span>
        </div>
      ) : null}
    </div>
  );
}
