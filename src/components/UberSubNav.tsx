"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/uber", label: "Dashboard" },
  { href: "/uber/ganhos", label: "Ganhos" },
  { href: "/uber/combustivel", label: "Combustível" },
  { href: "/uber/lancamentos", label: "Lançamentos" },
];

export function UberSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-black/10 pb-3 dark:border-white/10">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
