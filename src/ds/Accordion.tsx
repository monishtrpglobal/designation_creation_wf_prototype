"use client";

import { Accordion as MantineAccordion } from "@mantine/core";
import type { ReactNode } from "react";
import { IconChevronDown } from "./icons";
import styles from "./Accordion.module.css";

export type AccordionVariant = "filled" | "separated";
export type AccordionChevron = "left" | "right";

export type AccordionItemProps = {
  value: string;
  label: string;
  badge?: ReactNode;
  badge2?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
};

type AccordionProps = {
  variant?: AccordionVariant;
  chevron?: AccordionChevron;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  children: ReactNode;
};

export function AccordionItem({ value, label, badge, badge2, disabled, children }: AccordionItemProps) {
  return (
    <MantineAccordion.Item value={value} className={styles.item}>
      <MantineAccordion.Control disabled={disabled}>
        <span className={styles.title}>{label}</span>
        {badge || badge2 ? (
          <span className={styles.badges}>
            {badge}
            {badge2}
          </span>
        ) : null}
      </MantineAccordion.Control>
      <MantineAccordion.Panel>{children}</MantineAccordion.Panel>
    </MantineAccordion.Item>
  );
}

export function Accordion({
  variant = "filled",
  chevron = "left",
  value,
  defaultValue,
  onChange,
  children,
}: AccordionProps) {
  return (
    <MantineAccordion
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      variant={variant}
      chevronPosition={chevron === "left" ? "left" : "right"}
      chevron={<IconChevronDown size="s16" />}
      chevronSize="var(--space-s16)"
      classNames={{
        root: styles.root,
        item: styles.item,
        control: styles.control,
        label: styles.label,
        chevron: styles.chevron,
        panel: styles.panel,
        content: styles.content,
      }}
      transitionDuration={300}
    >
      {children}
    </MantineAccordion>
  );
}
