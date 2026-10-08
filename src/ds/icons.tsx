import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: "s12" | "s14" | "s16" | "s18" | "s20" | "s24" | "s32";
};

const sizeVar = {
  s12: "calc(var(--space-s16) - var(--space-s4))",
  s14: "calc(var(--space-s12) + var(--space-s2))",
  s16: "var(--space-s16)",
  s18: "calc(var(--space-s16) + var(--space-s2))",
  s20: "var(--space-s20)",
  s24: "var(--space-s24)",
  s32: "var(--space-s32)",
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

export function IconFileSpreadsheet(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M12 13v4" />
    </Glyph>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="m4.9 6.5 1.7 1" />
      <path d="m17.4 16.5 1.7 1" />
      <path d="m4.9 17.5 1.7-1" />
      <path d="m17.4 7.5 1.7-1" />
    </Glyph>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </Glyph>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Glyph>
  );
}

export function IconUserCircle(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M7.5 17.5a5 5 0 0 1 9 0" />
    </Glyph>
  );
}

export function IconLanguage(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </Glyph>
  );
}

export function IconMaximize(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9 4H4v5" />
      <path d="M15 4h5v5" />
      <path d="M20 15v5h-5" />
      <path d="M4 15v5h5" />
    </Glyph>
  );
}

export function IconLayoutSidebar(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
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
