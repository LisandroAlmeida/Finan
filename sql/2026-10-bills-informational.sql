-- Faturas "só visualização": aparecem na lista mas não entram nos totais. Somente adição.
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "informational" boolean NOT NULL DEFAULT false;
