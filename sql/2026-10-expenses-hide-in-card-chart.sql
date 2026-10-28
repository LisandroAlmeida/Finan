-- Permite ocultar uma compra do gráfico "Gastos por cartão" (continua no cartão e em Transações). Somente adição.
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "hide_in_card_chart" boolean NOT NULL DEFAULT false;
