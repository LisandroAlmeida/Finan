import Link from "next/link";

/** Cartão padrão das telas: título + subtítulo + link de ação opcional. */
export function Card({
  title,
  subtitle,
  action,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border bg-card p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && (
            <Link
              href={action.href}
              prefetch={false}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              {action.label}
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
