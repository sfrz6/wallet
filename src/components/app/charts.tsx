"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n/provider";

const PALETTE = [
  "#0e6b63",
  "#1d4e89",
  "#b45309",
  "#7a1f2b",
  "#0f6b4f",
  "#6d28d9",
  "#be185d",
  "#4b5563",
];

function useCurrencyFormat() {
  const { locale } = useI18n();
  return (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
      maximumFractionDigits: 3,
    }).format(value);
}

export interface MonthlyDatum {
  month: string;
  spending: number;
  income: number;
}

const TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-fg)",
  fontSize: 12,
};

export function MonthlyTrendChart({ data }: { data: MonthlyDatum[] }) {
  const { t } = useI18n();
  const fmt = useCurrencyFormat();
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted)" }} stroke="var(--color-border)" />
          <YAxis tick={{ fontSize: 12, fill: "var(--color-muted)" }} stroke="var(--color-border)" width={56} />
          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-surface-2)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name={t("reports.income")} fill="#157347" radius={[3, 3, 0, 0]} />
          <Bar dataKey="spending" name={t("reports.expense")} fill="#0e6b63" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface CategoryDatum {
  name: string;
  value: number;
}

export function CategoryPieChart({ data }: { data: CategoryDatum[] }) {
  const fmt = useCurrencyFormat();
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={1}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
