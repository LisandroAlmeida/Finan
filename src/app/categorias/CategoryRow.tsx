"use client";

import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";

type Category = { id: string; name: string; color: string };

export function CategoryRow({
  category,
  updateCategory,
  deleteCategory,
}: {
  category: Category;
  updateCategory: (formData: FormData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateCategory(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível excluir.");
      }
    });
  };

  if (editing) {
    return (
      <form
        action={handleSave}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-black/10 p-2 dark:border-white/10"
      >
        <input type="hidden" name="id" value={category.id} />
        <div className="flex flex-col">
          <label className="text-xs text-foreground/60">Nome</label>
          <input
            name="name"
            required
            defaultValue={category.name}
            className="w-40 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-foreground/60">Cor</label>
          <input
            name="color"
            type="color"
            defaultValue={category.color}
            className="h-[34px] w-12 rounded-md border border-black/15 dark:border-white/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
        >
          Cancelar
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 dark:border-white/10">
        <span
          className="rounded-full px-2.5 py-1 text-xs text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.name}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          editar
        </button>
        <ConfirmButton
          label="excluir"
          confirmMessage={`Excluir a categoria "${category.name}"? Só funciona se ela não tiver gastos ou assinaturas.`}
          pending={pending}
          onConfirm={handleDelete}
          className="text-xs text-red-600 hover:underline"
        />
      </div>
      {error && <p className="px-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
