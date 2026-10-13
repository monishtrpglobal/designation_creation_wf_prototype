"use client";

import { Menu } from "@mantine/core";
import type { Ref } from "react";
import { IconDotsVertical } from "./icons";
import styles from "./RowMenu.module.css";

export type RowMenuItem = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type RowMenuProps = {
  items: RowMenuItem[];
  label?: string;
  triggerRef?: Ref<HTMLButtonElement>;
};

export function RowMenu({ items, label = "Row actions", triggerRef }: RowMenuProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <button ref={triggerRef} type="button" className={styles.kebab} aria-label={label}>
          <IconDotsVertical size="s16" />
        </button>
      </Menu.Target>
      <Menu.Dropdown className={styles.dropdown}>
        {items.map((item) => (
          <Menu.Item
            key={item.label}
            className={styles.item}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
