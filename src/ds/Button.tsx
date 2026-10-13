import { Button as MantineButton } from "@mantine/core";
import type { ButtonProps as MantineButtonProps } from "@mantine/core";
import type { MouseEventHandler, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "warn" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = Omit<
  MantineButtonProps,
  "variant" | "size" | "color" | "leftSection" | "rightSection" | "loading" | "styles"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  leftIcon,
  rightIcon,
  iconOnly = false,
  loading,
  children,
  ...rest
}: ButtonProps) {
  return (
    <MantineButton
      {...rest}
      variant="transparent"
      disabled={disabled}
      loading={loading}
      leftSection={iconOnly ? undefined : leftIcon}
      rightSection={iconOnly ? undefined : rightIcon}
      data-irm-variant={variant}
      data-irm-size={size}
      data-icon-only={iconOnly || undefined}
      classNames={{
        root: styles.root,
        inner: styles.inner,
        label: styles.label,
        section: styles.section,
        loader: styles.loader,
      }}
    >
      {iconOnly ? leftIcon : children}
    </MantineButton>
  );
}
