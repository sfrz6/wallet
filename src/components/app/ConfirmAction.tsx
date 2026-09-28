"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/actions/result";

/**
 * A button that asks for confirmation, then runs a server action taking an id.
 * Refreshes the route on success and surfaces a translated error otherwise.
 */
export function ConfirmAction({
  id,
  action,
  confirmKey,
  children,
  variant = "ghost",
  className,
}: {
  id: string;
  action: (id: string) => Promise<ActionResult>;
  confirmKey: string;
  children: React.ReactNode;
  variant?: "ghost" | "danger" | "secondary";
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={cn("btn", `btn-${variant}`, "text-sm", className)}
      onClick={() => {
        if (!window.confirm(t(confirmKey))) return;
        startTransition(async () => {
          const res = await action(id);
          if (res.ok) router.refresh();
          else window.alert(t(res.error));
        });
      }}
    >
      {children}
    </button>
  );
}
