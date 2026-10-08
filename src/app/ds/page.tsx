import { Suspense } from "react";
import { Gallery } from "./Gallery";
import { Badge, type BadgeSize, type BadgeVariant } from "@/ds/Badge";
import { Button, type ButtonSize, type ButtonVariant } from "@/ds/Button";
import { badgeStatuses, statusBadge } from "@/ds/statusMap";

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "warn", "ghost"];
const buttonSizes: ButtonSize[] = ["xs", "sm", "md", "lg"];
const badgeVariants: BadgeVariant[] = [
  "light",
  "filled",
  "outline",
  "dot",
  "completed",
  "in-progress",
  "pending",
  "error",
  "warning",
  "info",
];
const badgeSizes: BadgeSize[] = ["sm", "md"];

function Glyph() {
  return (
    <span
      aria-hidden
      className="block h-full w-full rounded-full bg-current"
    />
  );
}

export default function DsPage() {
  return (
    <main className="grid gap-s32 bg-canvas p-s24 text-body">
      <h1 className="text-heading-h2 text-strong">Design system</h1>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Button</h2>
        {buttonVariants.map((variant) => (
          <div key={variant} className="grid gap-s8">
            <p className="text-label-l1">{variant}</p>
            <div className="flex flex-wrap items-center gap-s16">
              {buttonSizes.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size}
                </Button>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-s8">
          <p className="text-label-l1">disabled</p>
          <div className="flex flex-wrap items-center gap-s16">
            {buttonVariants.map((variant) => (
              <Button key={variant} variant={variant} disabled>
                {variant}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-s8">
          <p className="text-label-l1">loading</p>
          <div className="flex flex-wrap items-center gap-s16">
            {buttonVariants.map((variant) => (
              <Button key={variant} variant={variant} loading>
                {variant}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-s8">
          <p className="text-label-l1">icons</p>
          <div className="flex flex-wrap items-center gap-s16">
            <Button leftIcon={<Glyph />} rightIcon={<Glyph />}>
              Button
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Badge</h2>
        {badgeVariants.map((variant) => (
          <div key={variant} className="grid gap-s8">
            <p className="text-label-l1">{variant}</p>
            <div className="flex flex-wrap items-center gap-s16">
              {badgeSizes.map((size) => (
                <Badge key={size} variant={variant} size={size}>
                  {`${variant} ${size}`}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-s8">
          <p className="text-label-l1">statusBadge</p>
          <div className="flex flex-wrap items-center gap-s8">
            {badgeStatuses.map((status) => (
              <Badge key={status} variant={statusBadge(status)}>
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    </main>
  );
}
