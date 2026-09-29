"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { BANK_COLORS, BANK_INITIALS, BANK_KEYS, BANK_LOGOS, isBankKey, type BankKey } from "@/lib/banks";
import { cn } from "@/lib/cn";

function Avatar({ bank, size = 22 }: { bank: BankKey | null; size?: number }) {
  const logo = bank ? BANK_LOGOS[bank] : undefined;
  if (logo) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded border border-[color:var(--color-border)] bg-white"
        style={{ width: size, height: size, padding: size * 0.1 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" aria-hidden className="h-full w-full object-contain" />
      </span>
    );
  }
  const color = bank ? BANK_COLORS[bank] : "transparent";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded font-semibold text-white",
        !bank && "border border-dashed border-[color:var(--color-border-strong)] text-[color:var(--color-muted)]",
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {bank ? BANK_INITIALS[bank] : ""}
    </span>
  );
}

export function BankSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedKey = isBankKey(value) ? value : null;
  const selectedLabel = selectedKey ? t(`banks.${selectedKey}`) : t("common.none");

  const options: { key: BankKey | null; label: string }[] = [
    { key: null, label: t("common.none") },
    ...BANK_KEYS.map((k) => ({ key: k, label: t(`banks.${k}`) })),
  ];

  function choose(key: BankKey | null) {
    setValue(key ?? "");
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="field-label" htmlFor={`${listId}-button`}>
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        id={`${listId}-button`}
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-start"
      >
        <span className="flex items-center gap-2 truncate">
          <Avatar bank={selectedKey} />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 text-[color:var(--color-muted)]">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1 shadow-[var(--shadow-pop)]"
        >
          {options.map((opt) => {
            const active = (opt.key ?? "") === value;
            return (
              <li key={opt.key ?? "none"} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(opt.key)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-start text-sm",
                    active
                      ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-primary)]"
                      : "hover:bg-[color:var(--color-surface-2)]",
                  )}
                >
                  <Avatar bank={opt.key} />
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
