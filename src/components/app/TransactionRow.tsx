import { numericToMinor } from "@/lib/money";
import { formatDate } from "@/lib/date";
import { flowForType, typeLabelKey } from "@/lib/tx-display";
import { AmountText } from "@/components/AmountText";
import type { AppLocale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/translate";
import type { TransactionListItem } from "@/domain/transactions";

export function TransactionRow({
  item,
  locale,
  currency,
  t,
  action,
}: {
  item: TransactionListItem;
  locale: AppLocale;
  currency: string;
  t: TFunction;
  action?: React.ReactNode;
}) {
  const { transaction: tx } = item;
  const flow = flowForType(tx.type);
  const amount = numericToMinor(tx.amount);
  const displayMinor = flow === "out" ? -amount : amount;
  const tone = flow === "in" ? "positive" : flow === "out" ? "negative" : "neutral";

  const parts: string[] = [];
  if (item.categoryName) parts.push(item.categoryName);
  if (tx.type === "transfer" || tx.type === "credit_card_payment") {
    if (item.accountName && item.counterpartyName) {
      parts.push(`${item.accountName} → ${item.counterpartyName}`);
    }
  } else if (item.accountName) {
    parts.push(item.accountName);
  }
  const subtitle = parts.join(" · ");

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{t(typeLabelKey(tx.type))}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-[color:var(--color-muted)]">
          {subtitle ? `${subtitle} · ` : ""}
          {formatDate(tx.occurredOn, locale)}
        </div>
        {tx.note && (
          <div className="mt-0.5 truncate text-xs text-[color:var(--color-muted)]">{tx.note}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <AmountText
          minor={displayMinor}
          locale={locale}
          currency={currency}
          tone={tone}
          showSign={flow !== "neutral"}
          className="text-sm font-semibold"
        />
        {action}
      </div>
    </div>
  );
}
