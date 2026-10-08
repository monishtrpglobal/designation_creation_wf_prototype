"use client";

import { MultiSelect as MantineMultiSelect } from "@mantine/core";
import type { ReactNode } from "react";
import { IconInfo } from "./icons";
import { Tooltip } from "./Tooltip";
import styles from "./field.module.css";
import type { SelectOption } from "./Select";

type MultiSelectProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  tooltip?: ReactNode;
  required?: boolean;
  placeholder?: string;
  data: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  nothingFoundMessage?: ReactNode;
  dropdownOpened?: boolean;
  id?: string;
};

export function MultiSelect({
  label,
  description,
  error,
  tooltip,
  required,
  placeholder,
  data,
  value,
  defaultValue,
  onChange,
  disabled,
  loading = false,
  nothingFoundMessage = "No options",
  dropdownOpened,
  id,
}: MultiSelectProps) {
  return (
    <MantineMultiSelect
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
      data={loading ? [] : data}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      nothingFoundMessage={loading ? "Loading…" : nothingFoundMessage}
      dropdownOpened={dropdownOpened}
      comboboxProps={{ withinPortal: false }}
      data-error={error ? true : undefined}
      classNames={{
        root: styles.root,
        wrapper: styles.wrapper,
        label: styles.label,
        input: styles.input,
        inputField: styles.inputField,
        section: styles.section,
        description: styles.description,
        error: styles.error,
        dropdown: styles.dropdown,
        option: styles.option,
        empty: styles.empty,
        pill: styles.pill,
      }}
    />
  );
}
