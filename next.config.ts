import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telas antigas foram unificadas no redesign; os links salvos continuam funcionando
  // (a query string, como ?month=, é preservada pelo Next).
  async redirects() {
    return [
      { source: "/gastos", destination: "/transacoes", permanent: false },
      { source: "/entradas", destination: "/transacoes?tipo=receita", permanent: false },
      { source: "/reservas", destination: "/metas", permanent: false },
      { source: "/categorias", destination: "/configuracoes", permanent: false },
    ];
  },
};

export default nextConfig;
