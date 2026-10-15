import { PageHeader } from "@/components/PageHeader";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";
import { currentMonth, monthLabelLong } from "@/lib/month";
import { BillSection } from "@/components/BillSection";

export const dynamic = "force-dynamic";

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [accountList, billList] = await Promise.all([
    db.query.accounts.findMany({ where: and(eq(accounts.archived, false), eq(accounts.type, "conta")) }),
    db.query.bills.findMany({
      where: eq(bills.month, month),
      with: { account: true },
    }),
  ]);

  const contaBills = billList.filter((b) => b.account?.type === "conta");
  const billedAccountIds = new Set(contaBills.map((b) => b.accountId));
  const accountsWithoutBill = accountList.filter((a) => !billedAccountIds.has(a.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Contas" subtitle={`${monthLabelLong(month)} · contas fixas e a pagar (cadastro em Configurações)`} />

      <BillSection
        month={month}
        title="Contas a pagar do mês"
        redirectPath="/contas"
        accountsWithoutBill={accountsWithoutBill}
        billList={contaBills}
      />
    </main>
  );
}
