import { Paper } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

export type CardVariant = "flat" | "hoverable" | "border";

type CardProps = {
  variant?: CardVariant;
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
  header,
  body,
  footer,
  children,
  showHeader = true,
  showFooter = false,
  showBody = true,
}: CardProps) {
  return (
    <Paper
      withBorder={false}
      shadow="none"
      radius={0}
      data-irm-variant={variant}
      classNames={{ root: styles.card }}
    >
      {showHeader && header ? <p className={styles.header}>{header}</p> : null}
      {showBody && body ? <p className={styles.body}>{body}</p> : null}
      {children ? <div className={styles.content}>{children}</div> : null}
      {showFooter && footer ? <p className={styles.footer}>{footer}</p> : null}
    </Paper>
  );
}
