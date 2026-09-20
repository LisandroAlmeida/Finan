import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  date,
  boolean,
  integer,
  timestamp,
  pgEnum,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const accountTypeEnum = pgEnum("account_type", ["conta", "cartao"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["mensal", "anual"]);
export const paymentMethodEnum = pgEnum("payment_method", ["boleto", "pix"]);
export const goalKeyEnum = pgEnum("goal_key", [
  "reserva_emergencia",
  "aumento_renda",
]);
export const uberExpenseCategoryEnum = pgEnum("uber_expense_category", [
  "combustivel",
  "manutencao",
  "lavagem",
  "seguro",
  "ipva_licenciamento",
  "financiamento",
  "pedagio_estacionamento",
  "internet_celular",
  "alimentacao",
  "outros",
]);

// ---------- Categorias de gasto ----------
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  icon: text("icon"), // nome do emoji/ícone, ex: "shopping-cart"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Contas e cartões ----------
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // ex: "Bradesco", "Nubank"
  bank: text("bank").notNull(), // chave usada pra achar o logo, ex: "bradesco", "nubank"
  type: accountTypeEnum("type").notNull().default("cartao"),
  closingDay: integer("closing_day"), // não usado hoje: o dia de fechamento muda mês a mês, então
  // a fatura de cada gasto é decidida na hora do lançamento (flag "cai na fatura seguinte" em Gastos)
  dueDay: integer("due_day"), // dia de vencimento
  // Cartão adicional: aponta pro cartão titular. Cartões adicionais
  // compartilham UMA fatura só com o titular (ex: Lety/Lisandro 02/Lisandro
  // 30 são adicionais do Bradesco titular) — a fatura do mês é lançada só no
  // titular (parentAccountId nulo), nunca nos adicionais.
  parentAccountId: uuid("parent_account_id").references((): AnyPgColumn => accounts.id, {
    onDelete: "set null",
  }),
  lastFourDigits: varchar("last_four_digits", { length: 4 }), // últimos 4 dígitos do cartão
  expiryMonth: integer("expiry_month"), // validade do cartão (1-12)
  expiryYear: integer("expiry_year"), // validade do cartão (ex: 2029)
  // Só faz sentido pra contas (boletos/pix do dia a dia) — cartões não usam.
  paymentMethod: paymentMethodEnum("payment_method"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Entradas (renda do mês) ----------
export const incomes = pgTable("incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(), // ex: "Lisandro", "Esposa"
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  month: date("month", { mode: "string" }).notNull(), // sempre dia 1, ex: "2026-08-01"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Contas a pagar do mês (fatura de cada conta/cartão) ----------
export const bills = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  month: date("month", { mode: "string" }).notNull(),
  plannedAmount: numeric("planned_amount", { precision: 12, scale: 2 }).notNull(),
  actualAmount: numeric("actual_amount", { precision: 12, scale: 2 }),
  paidAt: date("paid_at", { mode: "string" }),
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Gastos (com suporte a parcelamento) ----------
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description"),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }), // forma de pagamento usada
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  month: date("month", { mode: "string" }).notNull(), // dia 1 do mês de referência (facilita filtro)
  essential: boolean("essential").notNull().default(false),
  // parcelamento: todas as parcelas de uma compra compartilham installmentGroupId
  installmentGroupId: uuid("installment_group_id"),
  installmentNumber: integer("installment_number"), // 1..total
  installmentTotal: integer("installment_total"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Assinaturas (gasto recorrente) ----------
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  billingCycle: billingCycleEnum("billing_cycle").notNull().default("mensal"),
  nextChargeDate: date("next_charge_date", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Reservas & investimentos ----------
export const reserves = pgTable("reserves", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ex: "Reserva de emergência", "Renda fixa", "Ações"
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Metas ----------
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: goalKeyEnum("key").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  month: date("month", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Uber Drive (controle de motorista de app) ----------
// Totalmente separado das contas da casa (accounts/expenses/bills/incomes) —
// é um controle à parte, não soma no Dashboard nem no "Restante para gastar".
// "Ganhos Totais" e "Km rodados" não são guardados: são calculados na hora de
// exibir, igual a planilha original fazia com fórmulas.
export const uberEarnings = pgTable("uber_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull(),
  platform: text("platform").notNull().default("Uber"), // "Uber", "99" etc
  kmInicial: integer("km_inicial"),
  kmFinal: integer("km_final"),
  horasTrabalhadas: numeric("horas_trabalhadas", { precision: 5, scale: 2 }),
  viagens: integer("viagens"),
  pontos: integer("pontos"),
  // Nulo até você preencher os detalhes do dia (ex: logo depois do lançamento
  // rápido do painel, que só grava km inicial/final).
  valor: numeric("valor", { precision: 12, scale: 2 }),
  promo: numeric("promo", { precision: 12, scale: 2 }),
  gorjetaExtras: numeric("gorjeta_extras", { precision: 12, scale: 2 }),
  bonus: numeric("bonus", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uberExpenses = pgTable("uber_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull(),
  category: uberExpenseCategoryEnum("category").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // livre (Pix/Crédito/Dinheiro) — não usa o enum das contas da casa
  // Só preenchidos quando category = "combustivel"; usados pra calcular
  // Km/L e R$/Km comparando com o abastecimento anterior.
  kmAbastecimento: integer("km_abastecimento"),
  litrosAbastecidos: numeric("litros_abastecidos", { precision: 8, scale: 2 }),
  // Preenchidos só quando esse gasto foi gerado por um "marcar como pago" em
  // Despesas do carro ou Financiamento — sem FK de verdade (é só um
  // vínculo de aplicação) pra não travar a exclusão da despesa fixa/
  // financiamento original.
  fixedExpenseId: uuid("fixed_expense_id"),
  financingId: uuid("financing_id"),
  parcelaNumero: integer("parcela_numero"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Despesas fixas recorrentes do carro (revisão, seguro, IPVA...): a
// definição fica aqui, e cada mês pago vira uma linha de verdade em
// uber_expenses (via fixedExpenseId) — assim entra nos totais normalmente.
export const uberFixedExpenses = pgTable("uber_fixed_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  category: uberExpenseCategoryEnum("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financiamento do veículo: parcelas fixas de valor igual, a partir de uma
// data de início. O número da parcela de um mês é calculado (não
// guardado) a partir de dataInicio; "marcar como pago" gera o gasto em
// uber_expenses (via financingId + parcelaNumero).
export const uberFinancings = pgTable("uber_financings", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  installmentAmount: numeric("installment_amount", { precision: 12, scale: 2 }).notNull(),
  installmentCount: integer("installment_count").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Relations (pra facilitar queries com .with) ----------
export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  account: one(accounts, {
    fields: [expenses.accountId],
    references: [accounts.id],
  }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  account: one(accounts, {
    fields: [bills.accountId],
    references: [accounts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
  account: one(accounts, {
    fields: [subscriptions.accountId],
    references: [accounts.id],
  }),
}));
