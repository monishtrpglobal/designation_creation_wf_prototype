"use client";

import { Drawer as MantineDrawer } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Drawer.module.css";

export type DrawerSize = "sm" | "md" | "lg" | "xl";

const drawerSize: Record<DrawerSize, string> = {
  sm: "var(--size-drawer-sm)",
  md: "var(--size-drawer-md)",
  lg: "var(--size-drawer-lg)",
  xl: "var(--size-drawer-xl)",
};

type DrawerProps = {
  opened: boolean;
  onClose: () => void;
  size?: DrawerSize;
  /** Stack above another overlay. Use a token such as the dropdown layer. */
  zIndex?: number;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Drawer({
  opened,
  onClose,
  size = "lg",
  zIndex,
  header,
  footer,
  children,
}: DrawerProps) {
  return (
    <MantineDrawer
      opened={opened}
      onClose={onClose}
      position="right"
      padding={0}
      withCloseButton={false}
      lockScroll
      trapFocus
      zIndex={zIndex}
      size={drawerSize[size]}
      styles={{
        overlay: {
          "--overlay-bg":
            "color-mix(in srgb, var(--color-bg-nav) var(--opacity-overlay-drawer), transparent)",
          "--overlay-filter": "blur(var(--blur-drawer))",
        },
      }}
      classNames={{
        content: styles.content,
        body: styles.mantineBody,
      }}
    >
      {header ? <header className={styles.header}>{header}</header> : null}
      <div className={styles.body}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </MantineDrawer>
  );
}
