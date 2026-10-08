"use client";

import { useFlowStore } from "@/state/flowStore";
import { useRouter } from "next/navigation";

export function useDemoNav() {
  const router = useRouter();
  const resetDemo = useFlowStore((state) => state.resetDemo);
  const clearDesignations = useFlowStore((state) => state.clearDesignations);

  return {
    onResetDemo: () => {
      resetDemo();
      router.push("/designations");
    },
    onEmptyCatalogue: () => {
      clearDesignations();
      router.push("/designations");
    },
  };
}
