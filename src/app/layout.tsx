import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getPeople } from "@/lib/people";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Finanças da Casa",
  description: "Controle financeiro pessoal — dashboard, gastos, contas e entradas",
  appleWebApp: { capable: true, title: "Finan", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
};

// Padrão escuro; só remove a classe se a pessoa escolheu o tema claro.
const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("theme")==="light"){document.documentElement.classList.remove("dark")}}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const people = await getPeople();
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <RegisterServiceWorker />
        <AppShell people={people}>{children}</AppShell>
      </body>
    </html>
  );
}
