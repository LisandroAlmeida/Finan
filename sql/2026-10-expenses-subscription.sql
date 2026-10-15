-- Marca uma despesa como assinatura/recorrente (alimenta o painel de Assinaturas). Somente adição.
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "is_subscription" boolean NOT NULL DEFAULT false;
