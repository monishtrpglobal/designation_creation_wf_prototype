import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";
import { IconAlertTriangle, IconCircleCheck, IconInfo } from "./icons";
import { Link } from "./Link";
import styles from "./DrawerFooterSummary.module.css";

export type DrawerFooterStatus = "success" | "warning" | "secondary";

type DrawerFooterSummaryProps = {
  label?: string;
  result: ReactNode;
  comparison?: ReactNode;
  status: DrawerFooterStatus;
  statusLabel: string;
  linkLabel?: string;
  linkHref?: string;
  onLinkClick?: () => void;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  secondaryVariant?: Extract<ButtonVariant, "secondary" | "warn">;
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
};

const statusIcon = {
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  secondary: IconInfo,
} as const;

export function DrawerFooterSummary({
  label = "What will be saved",
  result,
  comparison,
  status,
  statusLabel,
  linkLabel,
  linkHref,
  onLinkClick,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled,
  secondaryVariant = "secondary",
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
}: DrawerFooterSummaryProps) {
  const StatusIcon = statusIcon[status];

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        <p className={styles.label}>{label}</p>
        <p className={styles.result}>{result}</p>
        {comparison ? <p className={styles.comparison}>{comparison}</p> : null}
        <p className={styles.status} data-tone={status}>
          <StatusIcon size="s16" />
          <span>{statusLabel}</span>
        </p>
      </div>
      <hr className={styles.divider} />
      <div className={styles.actions}>
        {linkLabel ? (
          <Link
            href={linkHref}
            onClick={(event) => {
              if (!linkHref) {
                event.preventDefault();
              }
              onLinkClick?.();
            }}
          >
            {linkLabel}
          </Link>
        ) : null}
        <span className={styles.spacer} />
        {secondaryLabel ? (
          <Button variant={secondaryVariant} size="md" disabled={secondaryDisabled} onClick={onSecondaryClick}>
            {secondaryLabel}
          </Button>
        ) : null}
        {primaryLabel ? (
          <Button variant="primary" size="md" disabled={primaryDisabled} onClick={onPrimaryClick}>
            {primaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
