# Finanças da Casa

App de controle financeiro pessoal (substituto da planilha "Organização Financeira") — dashboard de gastos, cadastro de contas/cartões, gastos com parcelamento automático e entradas do mês.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind — front e back no mesmo projeto
- **Drizzle ORM** + **postgres.js** — sem dependência de binário nativo, funciona em qualquer lugar (inclusive Vercel Edge/Serverless)
- **Supabase** — Postgres gerenciado (é só usar a connection string; não precisa dos SDKs do Supabase pra essa parte)
- **Recharts** — gráficos do dashboard
- Sem login — o app assume uso compartilhado entre vocês dois, sem senha

## O que já está pronto (MVP — "mês completo")

- **Dashboard** (`/`): "restante pra gastar" (donut), fluxo de contas planejado x real, alocação por categoria, cards de meta (reserva de emergência e aumento de renda)
- **Gastos** (`/gastos`): cadastro de gastos por categoria/forma de pagamento/essencial, com **parcelamento automático** (informa o valor total e o número de parcelas, o app gera uma linha por mês)
- **Contas** (`/contas`): cadastro de contas/cartões (com "logo" colorido por banco) e lançamento/baixa da fatura do mês
- **Entradas** (`/entradas`): cadastro das entradas do mês

## O que falta (schema já existe, falta a tela)

- **Assinaturas** (tabela `subscriptions` já modelada: nome, valor, ciclo mensal/anual, próxima cobrança)
- **Reservas & Investimentos** (tabela `reserves` já modelada — hoje só entra via seed/SQL, falta uma tela de cadastro)
- **Metas** (tabela `goals` já modelada e já aparece no dashboard — falta uma tela pra editar o valor da meta pela interface, hoje é via seed/SQL)
- Importar o histórico da planilha antiga

## Como rodar

### 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em [supabase.com](https://supabase.com) (free tier resolve)
2. Em **Project Settings → Database → Connection string**, copie a URI no modo **Connection pooling** (porta 6543) — é a que funciona bem em ambiente serverless (Vercel)

### 2. Configurar localmente

```bash
npm install
cp .env.example .env       # cole sua DATABASE_URL do Supabase
npm run db:push            # cria as tabelas no banco a partir do schema (src/db/schema.ts)
npm run db:seed            # opcional: popula com dados de exemplo (mês de Agosto/2026)
npm run dev                # http://localhost:3000
```

- `npm run db:studio` abre o Drizzle Studio (interface visual do banco) — útil pra cadastrar rapidamente reservas/metas enquanto essas telas não existem
- Pra mudar o schema depois: edite `src/db/schema.ts` e rode `npm run db:push` de novo

### 3. Subir pro GitHub

```bash
git add -A
git commit -m "Primeira versão do app de finanças"
git remote add origin <url-do-seu-repo-vazio-no-github>
git push -u origin main
```

### 4. Deploy na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new)
2. Em **Environment Variables**, adicione `DATABASE_URL` com a mesma connection string do Supabase (pooling)
3. Deploy — a Vercel já detecta que é Next.js e configura tudo sozinha

## Estrutura de pastas

```
src/
  db/
    schema.ts      Modelo de dados (Drizzle)
    index.ts       Client de conexão
    seed.ts         Dados de exemplo
  lib/
    format.ts        Formatação de moeda/data
    month.ts          Helpers pra navegação entre meses
    banks.ts          Dicionário de bancos (cor/sigla do "logo")
  components/       Componentes de UI (nav, gráficos, badges)
  app/
    page.tsx          Dashboard
    gastos/           Página + server actions de Gastos
    contas/           Página + server actions de Contas
    entradas/         Página + server actions de Entradas
```

## Próximos passos sugeridos

1. Tela de Assinaturas (reaproveita o mesmo padrão de `/contas`)
2. Tela de Reservas & Investimentos + edição de Metas
3. Import do histórico da planilha antiga (script pontual lendo o CSV exportado do Google Sheets)
4. PWA / ajustes de mobile pra sua esposa usar bem pelo celular
