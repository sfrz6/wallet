"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Accessible dialog. Renders as a centered card on desktop and a bottom sheet on
 * mobile. Closes on Escape and backdrop click, and locks background scroll.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog.
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none rounded-t-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="btn btn-ghost -me-2 px-2 py-1 text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div
          className="px-5 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
