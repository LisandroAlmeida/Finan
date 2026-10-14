import { Download, LogOut, Users } from "lucide-react";
import { db } from "@/db";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ghostButtonClass, inputClass, primaryButtonClass } from "@/components/ui";
import { PAID_BY_OPTIONS } from "@/lib/people";
import { logoutAction } from "@/app/login/actions";
import { CategoryRow } from "./CategoryRow";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORY_COLOR = "#3B82F6";

export default async function ConfiguracoesPage() {
  const categoryList = await db.query.categories.findMany({ orderBy: (table, { asc }) => asc(table.name) });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Configurações" subtitle="Família, categorias e preferências" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Família" subtitle="Quem aparece em “Quem pagou”">
          <ul className="space-y-3">
            {PAID_BY_OPTIONS.map((person) => (
              <li key={person.value} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: person.color }}
                >
                  {person.value === "casal" ? <Users size={16} /> : <span className="text-xs font-semibold">{person.label.slice(0, 2)}</span>}
                </span>
                <span className="text-sm font-medium">{person.label}</span>
              </li>
            ))}
          </ul>
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
    </main>
  );
}
