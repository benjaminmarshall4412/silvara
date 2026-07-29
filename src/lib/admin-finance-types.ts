export const FINANCE_CATEGORIES = ["ads", "shipping", "socks", "other"] as const;
export type FinanceCategory = (typeof FINANCE_CATEGORIES)[number];

export function isFinanceCategory(value: unknown): value is FinanceCategory {
  return (
    typeof value === "string" &&
    (FINANCE_CATEGORIES as readonly string[]).includes(value)
  );
}

export type FinanceEntryRow = {
  id: string;
  date: string;
  category: FinanceCategory;
  amountCents: number;
  currency: string;
  note: string | null;
};

export type RevenueByCurrency = {
  currency: string;
  amountCents: number;
  orderCount: number;
};
