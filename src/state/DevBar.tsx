"use client";

import { Button } from "@/ds/Button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFlowStore } from "./flowStore";

export function FlowHydration() {
  const setHydrated = useFlowStore((state) => state.setHydrated);

  useEffect(() => {
    void Promise.resolve(useFlowStore.persist.rehydrate()).finally(() => {
      setHydrated(true);
    });
  }, [setHydrated]);

  return null;
}

export function DevBar() {
  const resetDemo = useFlowStore((state) => state.resetDemo);
  const clearDesignations = useFlowStore((state) => state.clearDesignations);
  const router = useRouter();

  return (
    <div className="flex items-center gap-s12 border-b border-neutral-border bg-surface px-s16 py-s8">
      <span className="text-body-b4 text-secondary">Prototype</span>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          resetDemo();
          router.push("/designations");
        }}
      >
        Reset demo
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          clearDesignations();
          router.push("/designations");
        }}
      >
        Empty catalogue
      </Button>
    </div>
  );
}
