import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/month";

export function MonthSwitcher({ month, basePath }: { month: string; basePath: string }) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <Link
        href={`${basePath}?month=${prev}`}
        className="rounded-full px-2 py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Mês anterior"
      >
        ←
      </Link>
      <span className="min-w-[10rem] text-center text-lg font-semibold capitalize">
        {monthLabel(month)}
      </span>
      <Link
        href={`${basePath}?month=${next}`}
        className="rounded-full px-2 py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Próximo mês"
      >
        →
      </Link>
    </div>
  );
}
