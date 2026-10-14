"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { iconButtonClass, inputClass } from "@/components/ui";

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

  function runAction(run: () => Promise<void>, fallbackMessage: string, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await run();
        onSuccess?.();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : fallbackMessage);
      }
    });
  }

  if (editing) {
    return (
      <li className="py-2">
        <form
          action={(formData) => runAction(() => updateCategory(formData), "Não foi possível salvar.", () => setEditing(false))}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="id" value={category.id} />
          <input
            name="color"
            type="color"
            defaultValue={category.color}
            aria-label="Cor"
            className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border bg-background p-1"
          />
          <input name="name" required defaultValue={category.name} className={inputClass} />
          <button type="submit" disabled={pending} aria-label="Salvar" className={`${iconButtonClass} text-primary`}>
            <Check size={16} />
          </button>
          <button type="button" onClick={() => setEditing(false)} aria-label="Cancelar" className={iconButtonClass}>
            <X size={16} />
          </button>
        </form>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </li>
    );
  }

  return (
    <li className="py-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
        <button type="button" aria-label="Editar" onClick={() => setEditing(true)} className={iconButtonClass}>
          <Pencil size={14} />
        </button>
        <button
          type="button"
          aria-label="Excluir"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Excluir a categoria "${category.name}"? Só funciona se ela não tiver lançamentos.`)) {
              runAction(() => deleteCategory(category.id), "Não foi possível excluir.");
            }
          }}
          className={`${iconButtonClass} hover:text-destructive`}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </li>
  );
}
