"use client";

import { Tabs as MantineTabs } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

export type TabsVariant = "underline" | "pill";
export type TabsOrientation = "horizontal" | "vertical";

export type TabItem = {
  value: string;
  label: string;
  count?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  panel?: ReactNode;
};

type TabsProps = {
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  items: TabItem[];
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string | null) => void;
};

export function Tabs({
  variant = "underline",
  orientation = "horizontal",
  items,
  value,
  defaultValue,
  onChange,
}: TabsProps) {
  return (
    <MantineTabs
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onChange={onChange}
      orientation={orientation}
      keepMounted={false}
    >
      <MantineTabs.List className={styles.list} data-variant={variant} data-orientation={orientation}>
        {items.map((item) => (
          <MantineTabs.Tab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            leftSection={item.icon}
            rightSection={item.count}
            className={styles.tab}
            data-variant={variant}
          >
            {item.label}
          </MantineTabs.Tab>
        ))}
      </MantineTabs.List>
      {items.map((item) => (
        <MantineTabs.Panel key={item.value} value={item.value} className={styles.panel}>
          {item.panel}
        </MantineTabs.Panel>
      ))}
    </MantineTabs>
  );
}
