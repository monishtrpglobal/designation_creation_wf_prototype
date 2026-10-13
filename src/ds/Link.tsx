import { Anchor } from "@mantine/core";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import styles from "./Link.module.css";

type LinkProps = {
  children: ReactNode;
  href?: string;
  id?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  style?: CSSProperties;
};

export function Link({ children, disabled, href, onClick, ...rest }: LinkProps) {
  return (
    <Anchor
      {...rest}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      underline="never"
      classNames={{ root: styles.root }}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </Anchor>
  );
}
