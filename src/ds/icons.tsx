import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: "s12" | "s14" | "s16" | "s20" | "s24";
};

const sizeVar = {
  s12: "calc(var(--space-s16) - var(--space-s4))",
  s14: "calc(var(--space-s12) + var(--space-s2))",
  s16: "var(--space-s16)",
  s20: "var(--space-s20)",
  s24: "var(--space-s24)",
} as const;

function Glyph({ size = "s16", children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      width={sizeVar[size]}
      height={sizeVar[size]}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Glyph>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Glyph>
  );
}

export function IconAlertCircle(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </Glyph>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4 3 19h18L12 4z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

export function IconCircleCheck(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </Glyph>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Glyph>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 7 7 17" />
    </Glyph>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Glyph>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m6 9 6 6 6-6" />
    </Glyph>
  );
}

export function IconChevronUp(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m6 15 6-6 6 6" />
    </Glyph>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m15 6-6 6 6 6" />
    </Glyph>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m9 6 6 6-6 6" />
    </Glyph>
  );
}

export function IconChevronsLeft(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m11 7-5 5 5 5" />
      <path d="m18 7-5 5 5 5" />
    </Glyph>
  );
}

export function IconChevronsRight(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m13 17 5-5-5-5" />
      <path d="m6 17 5-5-5-5" />
    </Glyph>
  );
}

export function IconSelector(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m8 9 4-4 4 4" />
      <path d="m8 15 4 4 4-4" />
    </Glyph>
  );
}

export function IconArrowsSort(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 9V4" />
      <path d="m5 7 3-3 3 3" />
      <path d="M16 15v5" />
      <path d="m13 17 3 3 3-3" />
    </Glyph>
  );
}

export function IconSortAscending(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Glyph>
  );
}

export function IconSortDescending(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </Glyph>
  );
}

export function IconDotsVertical(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </Glyph>
  );
}
