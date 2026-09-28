import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getDb } from "@/db";
import { listAccounts } from "@/domain/accounts";
import { listCategories } from "@/domain/categories";
import { AppShell } from "@/components/app/AppShell";
import { QuickAddProvider } from "@/components/app/QuickAddProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
  const db = getDb();
  const [accounts, categories] = await Promise.all([
    listAccounts(db, user.id),
    listCategories(db, user.id),
  ]);

  const accLite = accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }));
  const catLite = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  return (
    <QuickAddProvider accounts={accLite} categories={catLite}>
      <AppShell userName={user.usernameDisplay}>{children}</AppShell>
    </QuickAddProvider>
  );
}
