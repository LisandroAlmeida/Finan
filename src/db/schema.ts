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
