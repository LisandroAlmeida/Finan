import type { LucideIcon } from "lucide-react";

/** Card de indicador do topo da Visão Geral (ícone colorido + valor em fonte mono). */
export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
  valueClassName = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  color: string;
  valueClassName?: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-card p-5"
      style={{ backgroundImage: `linear-gradient(135deg, ${color}14, transparent 60%)` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}26`, color }}
        >
          <Icon size={16} />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`num mt-3 text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
