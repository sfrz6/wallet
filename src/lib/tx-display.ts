import type { TransactionType } from "@/db/schema";

/** Direction of the amount from the user's cash perspective, for display. */
export type FlowDirection = "in" | "out" | "neutral";

export function flowForType(type: TransactionType): FlowDirection {
  switch (type) {
    case "income":
    case "borrow":
    case "loan_repayment_received":
      return "in";
    case "expense":
    case "credit_card_payment":
    case "loan_disbursement":
    case "debt_repayment_paid":
      return "out";
    case "transfer":
      return "neutral";
    default:
      return "neutral";
  }
}

export function typeLabelKey(type: TransactionType): string {
  return `transactions.typeLabels.${type}`;
}
