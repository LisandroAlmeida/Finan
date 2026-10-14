"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  // O servidor sempre renderiza escuro (padrão); o script inline do layout
  // aplica a preferência salva antes da primeira pintura.
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => true);

  function toggleTheme() {
    const nextIsDark = !isDarkNow();
    document.documentElement.classList.toggle("dark", nextIsDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    } catch {
      // armazenamento indisponível (aba privada etc.): só não persiste.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema"
      title={isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
