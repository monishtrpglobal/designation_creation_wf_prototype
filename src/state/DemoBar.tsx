"use client";

import { Button } from "@/ds/Button";
import { useDemoNav } from "@/features/designation/demoNav";

/**
 * Prototype-only controls. Sits below the app frame so the screens match the Figma frames.
 */
export function DemoBar() {
  const { onResetDemo, onEmptyCatalogue } = useDemoNav();

  return (
    <aside
      aria-label="Prototype controls"
      className="flex items-center justify-end gap-s12 border-t border-solid border-subtle bg-surface-white px-s24 py-s8"
    >
      <p className="text-control-sm text-body" style={{ fontFamily: "var(--font-family-control-sm)" }}>
        Prototype controls (not part of the design)
      </p>
      <Button variant="secondary" size="sm" onClick={onResetDemo}>
        Reset demo
      </Button>
      <Button variant="secondary" size="sm" onClick={onEmptyCatalogue}>
        Empty catalogue
      </Button>
    </aside>
  );
}
