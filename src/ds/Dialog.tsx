"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Dialog.module.css";

export type DialogSize = "sm" | "md" | "lg";

const dialogSize: Record<DialogSize, string> = {
  sm: "var(--size-dialog-sm)",
  md: "var(--size-dialog-md)",
  lg: "var(--size-dialog-lg)",
};

type DialogProps = {
  opened: boolean;
  onClose: () => void;
  size?: DialogSize;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Dialog({
  opened,
  onClose,
  size = "md",
  header,
  footer,
  children,
}: DialogProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      padding={0}
      radius={0}
      withCloseButton={false}
      lockScroll
      trapFocus
      size={dialogSize[size]}
      styles={{
        overlay: {
          "--overlay-bg":
            "color-mix(in srgb, var(--color-bg-nav) var(--opacity-overlay-drawer), transparent)",
          "--overlay-filter": "blur(var(--blur-modal))",
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
    </Modal>
  );
}
