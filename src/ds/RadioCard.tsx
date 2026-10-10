"use client";

import { Radio } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./RadioCard.module.css";

type RadioCardProps = {
  value: string;
  title: ReactNode;
  subtitle?: ReactNode;
  unavailable?: boolean;
  disabled?: boolean;
};

export function RadioCard({ value, title, subtitle, unavailable = false, disabled }: RadioCardProps) {
  return (
    <Radio.Card value={value} disabled={disabled} classNames={{ card: styles.card }}>
      <Radio.Indicator classNames={{ indicator: styles.indicator }} />
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        {unavailable ? <span className={styles.tag}>Unavailable</span> : null}
      </span>
    </Radio.Card>
  );
}

type RadioCardGroupProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: ReactNode;
  direction?: "column" | "row";
  children: ReactNode;
};

export function RadioCardGroup({
  value,
  defaultValue,
  onChange,
  label,
  direction = "column",
  children,
}: RadioCardGroupProps) {
  return (
    <Radio.Group
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      label={label}
      classNames={{ root: direction === "row" ? `${styles.group} ${styles.row}` : styles.group }}
    >
      {children}
    </Radio.Group>
  );
}
