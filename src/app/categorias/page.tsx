import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CategoryRow } from "./CategoryRow";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categoryList = await db.query.categories.findMany({ orderBy: asc(categories.name) });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-lg font-semibold">Categorias</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Essas são as categorias disponíveis em Gastos e Assinaturas. Cadastre uma nova sempre que
        precisar de uma que ainda não existe.
      </p>

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <form action={createCategory} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: 🎮 Lazer"
              className="w-56 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Cor</label>
            <input
              name="color"
              type="color"
              defaultValue="#3B82F6"
              className="h-[34px] w-14 rounded-md border border-black/15 dark:border-white/20"
            />
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Cadastrar
          </button>
        </form>
        <p className="mt-2 text-xs text-black/50 dark:text-white/50">
          Dica: comece o nome com um emoji (ex: &quot;🍔 Restaurante&quot;) pra ele aparecer junto
          nas listas de seleção.
        </p>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {categoryList.map((c) => (
          <CategoryRow key={c.id} category={c} updateCategory={updateCategory} deleteCategory={deleteCategory} />
        ))}
        {categoryList.length === 0 && (
          <p className="text-black/50 dark:text-white/50">Nenhuma categoria cadastrada ainda.</p>
        )}
      </section>
    </main>
  );
}
