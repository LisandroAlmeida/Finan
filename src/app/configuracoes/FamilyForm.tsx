"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import { inputClass, primaryButtonClass } from "@/components/ui";
import type { Person } from "@/lib/people";

export function FamilyForm({
  people,
  saveFamilyNames,
}: {
  people: Person[];
  saveFamilyNames: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveFamilyNames(formData);
          setSaved(true);
        })
      }
      className="space-y-3"
    >
      {people.map((person) => (
        <div key={person.value} className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: person.color }}
          >
            {person.value === "casal" ? (
              <Users size={16} />
            ) : (
              <span className="text-xs font-semibold">{person.label.slice(0, 2)}</span>
            )}
          </span>
          <input
            name={person.value}
            defaultValue={person.label}
            maxLength={30}
            aria-label={`Nome de ${person.value}`}
            onChange={() => setSaved(false)}
            className={inputClass}
          />
        </div>
      ))}
      <div className="flex items-center justify-end gap-3 pt-1">
        {saved && <span className="text-xs text-emerald-500">Nomes salvos</span>}
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          {isPending ? "Salvando…" : "Salvar nomes"}
        </button>
      </div>
    </form>
  );
}
