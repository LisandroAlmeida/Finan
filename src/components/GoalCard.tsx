import { formatCurrency } from "@/lib/format";

export function GoalCard({
  title,
  target,
  reservedThisMonth,
  totalReserved,
}: {
  title: string;
  target: number;
  reservedThisMonth: number;
  totalReserved: number;
}) {
  const missing = target - totalReserved;
  const pct = target > 0 ? Math.min(100, (totalReserved / target) * 100) : 0;

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">Meta geral</dt>
          <dd>{formatCurrency(target)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">Reservado esse mês</dt>
          <dd>{formatCurrency(reservedThisMonth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">Total já reservado</dt>
          <dd>{formatCurrency(totalReserved)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Faltante para completar</dt>
          <dd className={missing > 0 ? "" : "text-green-600"}>{formatCurrency(missing)}</dd>
        </div>
      </dl>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
