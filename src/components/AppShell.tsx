"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Plus,
  Settings,
  Target,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/login/actions";
import { currentMonth, monthLabelLong, shiftMonth } from "@/lib/month";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rotas que mantêm este item do menu marcado como ativo. */
  matches: string[];
};

// Mesmos 6 menus do app de referência. As telas antigas continuam existindo e
// ficam agrupadas dentro do menu mais parecido (abas logo abaixo do topo).
const MENU: MenuItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard, matches: ["/"] },
  {
    href: "/transacoes",
    label: "Transações",
    icon: ArrowLeftRight,
    matches: ["/transacoes", "/assinaturas"],
  },
  { href: "/orcamentos", label: "Orçamentos", icon: PieChart, matches: ["/orcamentos"] },
  { href: "/metas", label: "Metas & Sonhos", icon: Target, matches: ["/metas"] },
  {
    href: "/cartoes",
    label: "Contas & Cartões",
    icon: Wallet,
    matches: ["/cartoes", "/contas"],
  },
  { href: "/configuracoes", label: "Configurações", icon: Settings, matches: ["/configuracoes"] },
];

const SECTION_TABS: { matches: string[]; tabs: { href: string; label: string }[] }[] = [
  {
    matches: ["/transacoes", "/assinaturas"],
    tabs: [
      { href: "/transacoes", label: "Transações" },
      { href: "/assinaturas", label: "Assinaturas" },
    ],
  },
  {
    matches: ["/cartoes", "/contas"],
    tabs: [
      { href: "/cartoes", label: "Cartões" },
      { href: "/contas", label: "Contas" },
    ],
  },
];

const MONTH_PATHS = ["/", "/transacoes", "/orcamentos", "/assinaturas", "/cartoes", "/contas"];

function isActive(pathname: string, matches: string[]) {
  return matches.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
}

function MonthNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!MONTH_PATHS.includes(pathname)) return null;

  const month = searchParams.get("month") ?? currentMonth();
  const linkClass =
    "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card px-1.5 py-1">
      <Link
        href={`${pathname}?month=${shiftMonth(month, -1)}`}
        prefetch={false}
        aria-label="Mês anterior"
        className={linkClass}
      >
        <ChevronLeft size={14} />
      </Link>
      <span suppressHydrationWarning className="min-w-[8.5rem] text-center text-sm font-medium">
        {monthLabelLong(month)}
      </span>
      <Link
        href={`${pathname}?month=${shiftMonth(month, 1)}`}
        prefetch={false}
        aria-label="Próximo mês"
        className={linkClass}
      >
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function Avatars() {
  return (
    <div className="flex -space-x-2" aria-label="Lisandro e Lety">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-semibold text-white ring-2 ring-background">
        Li
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-[11px] font-semibold text-white ring-2 ring-background">
        Le
      </span>
    </div>
  );
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet size={18} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold tracking-tight">Finanças da Casa</p>
          <p className="text-[11px] text-muted-foreground">finanças do casal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {MENU.map((item) => {
          const active = isActive(pathname, item.matches);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={`flex h-10 items-center gap-3 rounded-[17px] px-3 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3">
        <Avatars />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">Lisandro &amp; Lety</p>
          <p className="truncate text-[11px] text-muted-foreground">conta compartilhada</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sair"
            title="Sair"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/login") return <>{children}</>;

  const sectionTabs = SECTION_TABS.find((section) => isActive(pathname, section.matches))?.tabs;

  return (
    <div className="min-h-screen">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border md:block">
        <Sidebar pathname={pathname} />
      </aside>

      {/* Gaveta (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border shadow-xl">
            <button
              aria-label="Fechar menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
            <Sidebar pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <button
            aria-label="Abrir menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu size={18} />
          </button>

          <Suspense fallback={null}>
            <MonthNav />
          </Suspense>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/transacoes?novo=1"
              prefetch={false}
              className="inline-flex h-8 items-center gap-1.5 rounded-[17px] bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:brightness-110"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nova Transação</span>
            </Link>
            <ThemeToggle />
            <div className="hidden sm:block">
              <Avatars />
            </div>
          </div>
        </header>

        {sectionTabs && (
          <div className="mx-auto max-w-6xl px-4 pt-5">
            <div className="inline-flex gap-1 rounded-full border bg-card p-1">
              {sectionTabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    prefetch={false}
                    className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
