"use client";

import { Modal } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Dialog.module.css";

export type DialogSize = "sm" | "md" | "lg" | "xl";

/**
 * default: header, body and footer bands with a blurred scrim.
 * confirm: plain card with a flat pure-black scrim (Figma Screen 12, delete draft confirm).
 */
export type DialogVariant = "default" | "confirm";

const dialogSize: Record<DialogSize, string> = {
  sm: "var(--size-dialog-sm)",
  md: "var(--size-dialog-md)",
  lg: "var(--size-dialog-lg)",
  xl: "var(--size-dialog-xl)",
};

type DialogProps = {
  opened: boolean;
  onClose: () => void;
  size?: DialogSize;
  variant?: DialogVariant;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Dialog({
  opened,
  onClose,
  size = "md",
  variant = "default",
  header,
  footer,
  children,
}: DialogProps) {
  const confirm = variant === "confirm";
  const part = (base: string, plain: string) => (confirm ? `${base} ${plain}` : base);

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
        overlay: confirm
          ? {
              "--overlay-bg":
                "color-mix(in srgb, var(--color-pure-black) var(--opacity-overlay-drawer), transparent)",
              "--overlay-filter": "none",
            }
          : {
              "--overlay-bg":
                "color-mix(in srgb, var(--color-bg-nav) var(--opacity-overlay-drawer), transparent)",
              "--overlay-filter": "blur(var(--blur-modal))",
            },
      }}
      classNames={{
        content: part(styles.content, styles.contentConfirm),
        body: part(styles.mantineBody, styles.mantineBodyConfirm),
      }}
    >
      {header ? <header className={part(styles.header, styles.headerConfirm)}>{header}</header> : null}
      <div className={part(styles.body, styles.bodyConfirm)}>{children}</div>
      {footer ? <footer className={part(styles.footer, styles.footerConfirm)}>{footer}</footer> : null}
    </Modal>
  );
}
