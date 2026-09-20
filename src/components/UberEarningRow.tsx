"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { earningDayTotal } from "@/app/uber/uber-shared";

type Earning = {
  id: string;
  date: string;
  platform: string;
  kmInicial: number | null;
  kmFinal: number | null;
  horasTrabalhadas: string | null;
  viagens: number | null;
  pontos: number | null;
  valor: string | null;
  promo: string | null;
  gorjetaExtras: string | null;
  bonus: string | null;
};

export function UberEarningRow({
  earning,
  updateUberEarning,
  deleteUberEarning,
}: {
  earning: Earning;
  updateUberEarning: (formData: FormData) => Promise<void>;
  deleteUberEarning: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateUberEarning(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUberEarning(earning.id);
    });
  };

  const kmRodados =
    earning.kmInicial != null && earning.kmFinal != null
      ? Math.max(0, earning.kmFinal - earning.kmInicial)
      : null;
  const ganhosTotais = earningDayTotal(earning);
  const ganhosPorHora =
    earning.horasTrabalhadas && Number(earning.horasTrabalhadas) > 0
      ? ganhosTotais / Number(earning.horasTrabalhadas)
      : null;

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={8} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={earning.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Data</label>
              <input
                name="date"
                type="date"
                required
                defaultValue={earning.date}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Plataforma</label>
              <input
                name="platform"
                defaultValue={earning.platform}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Km inicial</label>
              <input
                name="kmInicial"
                type="number"
                min="0"
                defaultValue={earning.kmInicial ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Km final</label>
              <input
                name="kmFinal"
                type="number"
                min="0"
                defaultValue={earning.kmFinal ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Horas</label>
              <input
                name="horasTrabalhadas"
                type="number"
                step="0.01"
                min="0"
                defaultValue={earning.horasTrabalhadas ?? ""}
                className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Viagens</label>
              <input
                name="viagens"
                type="number"
                min="0"
                defaultValue={earning.viagens ?? ""}
                className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Pontos</label>
              <input
                name="pontos"
                type="number"
                min="0"
                defaultValue={earning.pontos ?? ""}
                className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0"
                defaultValue={earning.valor ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Promo (R$)</label>
              <input
                name="promo"
                type="number"
                step="0.01"
                min="0"
                defaultValue={earning.promo ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Gorjeta/Extras (R$)</label>
              <input
                name="gorjetaExtras"
                type="number"
                step="0.01"
                min="0"
                defaultValue={earning.gorjetaExtras ?? ""}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Bônus (R$)</label>
              <input
                name="bonus"
                type="number"
                step="0.01"
                min="0"
                defaultValue={earning.bonus ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex gap-2">
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
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-black/10 dark:border-white/10">
      <td className="px-2 py-2">{formatDate(earning.date)}</td>
      <td className="px-2 py-2">{earning.platform}</td>
      <td className="px-2 py-2">{kmRodados != null ? `${kmRodados} km` : "-"}</td>
      <td className="px-2 py-2">{earning.horasTrabalhadas ? `${earning.horasTrabalhadas}h` : "-"}</td>
      <td className="px-2 py-2">{earning.viagens ?? "-"}</td>
      <td className="px-2 py-2">{formatCurrency(ganhosTotais)}</td>
      <td className="px-2 py-2">{ganhosPorHora != null ? formatCurrency(ganhosPorHora) : "-"}</td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            editar
          </button>
          <ConfirmButton
            label="excluir"
            confirmMessage="Excluir esse registro de ganhos? Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
