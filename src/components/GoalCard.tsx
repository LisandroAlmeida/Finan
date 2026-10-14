import { formatCurrency } from "@/lib/format";

/** Meta no estilo "Metas & Sonhos": valor guardado, alvo e barra de progresso. */
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
  const percent = target > 0 ? Math.min(100, (totalReserved / target) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-[11px] text-muted-foreground">{Math.round(percent)}% alcançado</span>
      </div>
      <p className="mt-1">
        <span className="num text-lg font-bold">{formatCurrency(totalReserved)}</span>
        <span className="num ml-1.5 text-xs text-muted-foreground">de {formatCurrency(target)}</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {formatCurrency(reservedThisMonth)} guardados neste mês
      </p>
    </div>
  );
}
