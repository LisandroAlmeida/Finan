import { Download, LogOut } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { AccountItem } from "@/components/AccountItem";
import { BANK_OPTIONS } from "@/lib/banks";
import { createAccount, updateAccount, deleteAccount } from "@/lib/accounts-actions";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ghostButtonClass, inputClass, primaryButtonClass } from "@/components/ui";
import { getPeople } from "@/lib/people";
import { logoutAction } from "@/app/login/actions";
import { CategoryRow } from "./CategoryRow";
import { FamilyForm } from "./FamilyForm";
import { saveFamilyNames } from "./familyActions";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORY_COLOR = "#3B82F6";

export default async function ConfiguracoesPage() {
  const [people, categoryList, contaList] = await Promise.all([
    getPeople(),
    db.query.categories.findMany({ orderBy: (table, { asc }) => asc(table.name) }),
    db.query.accounts.findMany({ where: and(eq(accounts.archived, false), eq(accounts.type, "conta")) }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Configurações" subtitle="Família, categorias e preferências" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Família" subtitle="Nomes que aparecem em “Quem pagou” e no menu">
          <FamilyForm people={people} saveFamilyNames={saveFamilyNames} />
        </Card>

        <Card title="Aparência e dados">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tema</p>
                <p className="text-xs text-muted-foreground">Alterna entre escuro e claro neste aparelho</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Exportar dados</p>
                <p className="text-xs text-muted-foreground">Todas as transações em CSV (abre no Excel)</p>
              </div>
              <a href="/api/export" className={ghostButtonClass}>
                <Download size={16} /> Baixar CSV
              </a>
            </div>
            <form action={logoutAction} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Sessão</p>
                <p className="text-xs text-muted-foreground">Sai deste aparelho</p>
              </div>
              <button type="submit" className={ghostButtonClass}>
                <LogOut size={16} /> Sair
              </button>
            </form>
          </div>
        </Card>

        {(["despesa", "receita"] as const).map((kind) => (
          <Card
            key={kind}
            title={kind === "despesa" ? "Categorias de despesa" : "Categorias de receita"}
            subtitle={kind === "despesa" ? "Usadas em transações, orçamentos e assinaturas" : "Usadas nas entradas"}
          >
            <form action={createCategory} className="mb-3 flex items-center gap-2">
              <input type="hidden" name="kind" value={kind} />
              <input
                name="color"
                type="color"
                defaultValue={DEFAULT_CATEGORY_COLOR}
                aria-label="Cor"
                className="h-10 w-11 shrink-0 cursor-pointer rounded-xl border bg-background p-1"
              />
              <input name="name" required placeholder="Nova categoria (ex.: 🎮 Lazer)" className={inputClass} />
              <button type="submit" className={primaryButtonClass}>
                Adicionar
              </button>
            </form>
            <ul className="divide-y">
              {categoryList
                .filter((category) => category.kind === kind)
                .map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    updateCategory={updateCategory}
                    deleteCategory={deleteCategory}
                  />
                ))}
            </ul>
          </Card>
        ))}
      </div>
      <section className="mt-4 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Contas cadastradas</h2>

        {contaList.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {contaList.map((a) => (
              <AccountItem key={a.id} account={a} updateAccount={updateAccount} deleteAccount={deleteAccount} />
            ))}
          </div>
        )}

        {contaList.length === 0 && (
          <p className="mb-4 text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
        )}

        <form action={createAccount} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="conta" />
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Internet Mãe"
              className="rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Banco</label>
            <select
              name="bank"
              className="rounded-lg border px-2 py-1.5"
            >
              {BANK_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Dia vencimento</label>
            <input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              className="w-24 rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Forma de pagamento</label>
            <select
              name="paymentMethod"
              defaultValue="boleto"
              className="rounded-lg border px-2 py-1.5"
            >
              <option value="boleto">Boleto</option>
              <option value="pix">Pix</option>
            </select>
          </div>
          <button className="rounded-lg bg-primary px-4 py-1.5 text-white hover:brightness-110">
            Cadastrar
          </button>
        </form>
      </section>
    </main>
  );
}
