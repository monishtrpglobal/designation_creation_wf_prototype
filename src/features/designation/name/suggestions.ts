import type { CardTint } from "@/ds/Card";

export type SuggestionIcon = "calculator" | "receipt" | "building-bank" | "chart-pie";

export type Suggestion = {
  name: string;
  description: string;
  icon: SuggestionIcon;
  inCatalogue?: boolean;
};

/**
 * Product owner to confirm: the designation is created as a draft when Next passes validation.
 * Product owner to confirm: suggestions are common job titles (sample data), not industry titles
 * or the most-used designations in this catalogue.
 * The first four titles, descriptions, and colours match the Screen 2 frame.
 * Finance Controller is the frame's "already in your catalogue" sample.
 * Titles after the first four are sample data for Show more suggestions; that dialog is not painted on the frame.
 */
export const suggestions: Suggestion[] = [
  {
    name: "Head of Accountant",
    description: "Owns the books and period close.",
    icon: "calculator",
  },
  {
    name: "Accounts Payable Lead",
    description: "Approves vendor invoices and payments.",
    icon: "receipt",
  },
  {
    name: "Treasury Analyst",
    description: "Manages bank accounts and cash.",
    icon: "building-bank",
  },
  {
    name: "Finance Controller",
    description: "Reviews reporting and controls.",
    icon: "chart-pie",
    inCatalogue: true,
  },
  {
    name: "Revenue Accountant",
    description: "Records revenue and reconciles contracts.",
    icon: "calculator",
  },
  {
    name: "Accounts Payable Clerk",
    description: "Processes invoices and vendor payments.",
    icon: "receipt",
  },
  {
    name: "Inventory Analyst",
    description: "Tracks stock levels and movements.",
    icon: "building-bank",
  },
  {
    name: "Payroll Specialist",
    description: "Runs payroll and employee payments.",
    icon: "chart-pie",
  },
];

export const previewCount = 4;

/** Card colours on the Screen 2 frame, left to right. */
export const previewTints: CardTint[] = ["mint", "blue", "lavender", "neutral"];

const moreTints: CardTint[] = ["mint", "blue", "lavender"];

export function suggestionTint(index: number, taken: boolean): CardTint {
  if (taken) {
    return "neutral";
  }
  const painted = previewTints[index];
  if (painted && painted !== "neutral") {
    return painted;
  }
  return moreTints[index % moreTints.length] ?? "mint";
}

export function namesMatch(field: string, suggestion: string) {
  const trimmed = field.trim().toLowerCase();
  return trimmed.length > 0 && trimmed === suggestion.trim().toLowerCase();
}
