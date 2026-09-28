export interface AccountLite {
  id: string;
  name: string;
  type: "debit" | "credit";
}

export interface CategoryLite {
  id: string;
  name: string;
  kind: "expense" | "income" | "both";
}

export type TxKind =
  | "expense"
  | "income"
  | "transfer"
  | "credit_card_payment"
  | "lend"
  | "borrow";
