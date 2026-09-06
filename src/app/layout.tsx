import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Finanças da Casa",
  description: "Controle financeiro pessoal — dashboard, gastos, contas e entradas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
