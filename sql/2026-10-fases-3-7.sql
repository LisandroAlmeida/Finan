-- Fases 3–7 do redesign (Meu Orçamento). Somente adições: nada é removido nem
-- reescrito, os dados existentes continuam intactos.

DO $$ BEGIN
  CREATE TYPE "public"."paid_by" AS ENUM ('lisandro', 'lety', 'casal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "public"."category_kind" AS ENUM ('despesa', 'receita');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "kind" "category_kind" NOT NULL DEFAULT 'despesa';
ALTER TABLE "expenses"   ADD COLUMN IF NOT EXISTS "paid_by" "paid_by";
ALTER TABLE "incomes"    ADD COLUMN IF NOT EXISTS "date" date;
ALTER TABLE "incomes"    ADD COLUMN IF NOT EXISTS "account_id" uuid;
ALTER TABLE "incomes"    ADD COLUMN IF NOT EXISTS "category_id" uuid;
ALTER TABLE "incomes"    ADD COLUMN IF NOT EXISTS "paid_by" "paid_by";

CREATE TABLE IF NOT EXISTS "savings_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "target_amount" numeric(12, 2) NOT NULL,
  "deadline" date,
  "color" text DEFAULT '#10B981' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "reserves" ADD COLUMN IF NOT EXISTS "goal_id" uuid;

CREATE TABLE IF NOT EXISTS "budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "month" date NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "budgets_category_month_unique" UNIQUE ("category_id", "month")
);

DO $$ BEGIN
  ALTER TABLE "incomes" ADD CONSTRAINT "incomes_account_id_accounts_id_fk"
    FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "reserves" ADD CONSTRAINT "reserves_goal_id_savings_goals_id_fk"
    FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categorias de receita padrão (só se ainda não existirem).
INSERT INTO "categories" ("name", "color", "kind")
SELECT v.name, v.color, 'receita'::category_kind
FROM (VALUES ('Salário', '#10B981'), ('Renda extra', '#3B82F6'), ('Investimentos', '#8B5CF6'), ('Outras receitas', '#F59E0B')) AS v(name, color)
WHERE NOT EXISTS (SELECT 1 FROM "categories" c WHERE c.name = v.name AND c.kind = 'receita');

-- Metas legadas viram metas & sonhos (uma vez só), com os aportes já existentes ligados.
INSERT INTO "savings_goals" ("name", "target_amount", "color")
SELECT 'Reserva de emergência',
       COALESCE((SELECT target_amount FROM goals WHERE key = 'reserva_emergencia' ORDER BY month DESC LIMIT 1), 0),
       '#10B981'
WHERE NOT EXISTS (SELECT 1 FROM savings_goals WHERE name = 'Reserva de emergência');
INSERT INTO "savings_goals" ("name", "target_amount", "color")
SELECT 'Aumentar a renda',
       COALESCE((SELECT target_amount FROM goals WHERE key = 'aumento_renda' ORDER BY month DESC LIMIT 1), 0),
       '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM savings_goals WHERE name = 'Aumentar a renda');

UPDATE "reserves" r SET goal_id = g.id
FROM "savings_goals" g
WHERE r.goal_id IS NULL AND (
  (r.type = 'Reserva de emergência' AND g.name = 'Reserva de emergência') OR
  (r.type = 'Aumentar renda' AND g.name = 'Aumentar a renda'));
