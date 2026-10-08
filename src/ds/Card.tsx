import { Paper } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

export type CardVariant = "flat" | "hoverable" | "border";
export type CardTint = "mint" | "blue" | "lavender" | "neutral";

type CardProps = {
  variant?: CardVariant;
  tint?: CardTint;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  showBody?: boolean;
};

export function Card({
  variant = "flat",
  tint,
  selected = false,
  disabled = false,
  onClick,
  header,
  body,
  footer,
  children,
  showHeader = true,
  showFooter = false,
  showBody = true,
}: CardProps) {
  const inner = (
    <>
      {showHeader && header ? <p className={styles.header}>{header}</p> : null}
      {showBody && body ? <p className={styles.body}>{body}</p> : null}
      {children ? <div className={styles.content}>{children}</div> : null}
      {showFooter && footer ? <p className={styles.footer}>{footer}</p> : null}
    </>
  );
  const markers = {
    "data-irm-variant": variant,
    "data-tint": tint,
    "data-selected": selected || undefined,
  };

  if (onClick || disabled) {
    return (
      <button
        type="button"
        className={styles.card}
        aria-disabled={disabled || undefined}
        aria-pressed={disabled ? undefined : selected}
        onClick={() => {
          if (disabled) {
            return;
          }
          onClick?.();
        }}
        {...markers}
      >
        {inner}
      </button>
    );
  }

  return (
    <Paper withBorder={false} shadow="none" radius={0} classNames={{ root: styles.card }} {...markers}>
      {inner}
    </Paper>
  );
}
