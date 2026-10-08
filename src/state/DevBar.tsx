"use client";

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
