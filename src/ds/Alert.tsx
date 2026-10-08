"use client";

import { Alert as MantineAlert } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconInfo } from "./icons";
import styles from "./Alert.module.css";

export type AlertType = "info" | "success" | "warning" | "error";

type AlertProps = {
  type?: AlertType;
  title?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  showTitle?: boolean;
  showBorder?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  secondaryAction?: ReactNode;
};

const icons = {
  info: IconInfo,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  error: IconAlertCircle,
} as const;

export function Alert({
  type = "info",
  title,
  children,
  compact = false,
  showTitle = true,
  showBorder = true,
  dismissible = false,
  onDismiss,
  action,
  secondaryAction,
}: AlertProps) {
  const Icon = icons[type];
  const titled = showTitle && !compact && title;
  const [open, setOpen] = useState(true);
  if (dismissible && !open) return null;

  return (
    <MantineAlert
      variant="transparent"
      icon={
        <span className={styles.icon}>
          <Icon size={compact ? "s20" : "s24"} />
        </span>
      }
      withCloseButton={dismissible}
      closeButtonLabel="Dismiss"
      onClose={() => {
        setOpen(false);
        onDismiss?.();
      }}
      data-type={type}
      data-compact={compact || undefined}
      data-border={showBorder || undefined}
      classNames={{
        root: styles.root,
        wrapper: styles.wrapper,
        body: styles.body,
        message: styles.message,
        icon: styles.icon,
        closeButton: styles.closeButton,
      }}
    >
      <span className={styles.copy}>
        {titled ? <span className={styles.title}>{title}</span> : null}
        <span className={styles.text}>{children}</span>
      </span>
      {secondaryAction || action ? (
        <span className={styles.actions}>
          {secondaryAction}
          {action}
        </span>
      ) : null}
    </MantineAlert>
  );
}
