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
  unique,
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
// Quem pagou (gastos) / quem recebeu (entradas). Nulo = não informado.
export const paidByEnum = pgEnum("paid_by", ["lisandro", "lety", "casal"]);
// Categorias de despesa e de receita aparecem em listas separadas.
export const categoryKindEnum = pgEnum("category_kind", ["despesa", "receita"]);
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

export const uberInvestmentCategoryEnum = pgEnum("uber_investment_category", [
  "veiculo",
  "documentacao",
  "equipamentos",
  "conforto",
  "identificacao",
  "protecao",
  "outros",
]);

export const uberVehicleOwnershipEnum = pgEnum("uber_vehicle_ownership", [
  "proprio",
  "financiado",
  "alugado",
  "outro",
]);

// ---------- Categorias de gasto ----------
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  icon: text("icon"), // nome do emoji/ícone, ex: "shopping-cart"
  kind: categoryKindEnum("kind").notNull().default("despesa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Contas e cartões ----------
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // ex: "Bradesco", "Nubank"
  bank: text("bank").notNull(), // chave usada pra achar o logo, ex: "bradesco", "nubank"
  type: accountTypeEnum("type").notNull().default("cartao"),
  closingDay: integer("closing_day"), // não usado hoje: o dia de fechamento muda mês a mês, então
  // a fatura de cada gasto é decidida na hora do lançamento (flag "cai na fatura seguinte" em Transações)
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
  // Campos novos (Transações unificadas): entradas antigas não têm data/conta/categoria.
  date: date("date", { mode: "string" }),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  paidBy: paidByEnum("paid_by"),
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
  // Só para visualizar: não entra em totais nem na Visão Geral (ex.: fatura de cartão repetida em Contas).
  informational: boolean("informational").notNull().default(false),
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
  paidBy: paidByEnum("paid_by"),
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
// Metas & Sonhos: cada meta tem nome, valor alvo e prazo opcional. Os aportes
// de uma meta são linhas de `reserves` com goalId preenchido (assim o histórico
// de reservas já existente vira o histórico de aportes).
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  deadline: date("deadline", { mode: "string" }),
  color: text("color").notNull().default("#10B981"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reserves = pgTable("reserves", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ex: "Reserva de emergência", "Renda fixa", "Ações"
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  goalId: uuid("goal_id").references(() => savingsGoals.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configurações simples chave/valor (ex.: nomes exibidos de Lisandro, Lety e Casal).
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------- Orçamentos (limite mensal por categoria) ----------
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: date("month", { mode: "string" }).notNull(), // dia 1 do mês
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique("budgets_category_month_unique").on(table.categoryId, table.month)],
);

// ---------- Metas ----------
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: goalKeyEnum("key").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  month: date("month", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Uber Drive (tabelas do app uber-app) ----------
// ATENÇÃO: a aba Uber saiu deste app — hoje essas tabelas são usadas só pelo
// repositório uber-app, que usa o MESMO banco. Elas ficam declaradas aqui só
// para o `drizzle-kit push` deste app não apagá-las. Se mudar o schema no
// uber-app, espelhe aqui. Não há mais código deste app lendo/gravando nelas.
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
  paymentMethod: text("payment_method"), // livre (cartão, Pix, Dinheiro...)
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
  // Quando preenchidos, a despesa é parcelada (ex: revisão em 10x) em vez de
  // recorrente indefinida (ex: seguro mensal): o número da parcela do mês é
  // calculado a partir de installmentStartDate, igual ao financiamento.
  installmentCount: integer("installment_count"),
  installmentStartDate: date("installment_start_date", { mode: "string" }),
  // Só usado quando category = "manutencao": sistema do carro (motor, freios...).
  maintenanceSystem: text("maintenance_system"),
  // Só manutenção: Pix ou cartão (C6, Amazon, Mercado Pago).
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financiamento do veículo: parcelas fixas de valor igual, a partir de uma
// data de início. O número da parcela de um mês é calculado (não
// guardado) a partir de dataInicio; "marcar como pago" gera o gasto em
// uber_expenses (via financingId + parcelaNumero).
export const uberFinancings = pgTable("uber_financings", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  // Só informativo (preço de tabela do carro) — não entra na conta do
  // "total projetado do carro", que é sempre entrada + parcelas.
  carPrice: numeric("car_price", { precision: 12, scale: 2 }),
  // Valor de entrada pago à vista — soma com as parcelas pro "total
  // projetado do carro".
  downPayment: numeric("down_payment", { precision: 12, scale: 2 }).notNull().default("0"),
  installmentAmount: numeric("installment_amount", { precision: 12, scale: 2 }).notNull(),
  installmentCount: integer("installment_count").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Faturas de cartão marcadas como pagas. Um ciclo de fatura é identificado
// por (card, closingDate) — closingDate calculado por faturaClosingDateFor
// (uber-shared.ts) a partir da data de cada compra, nunca guardado nos
// gastos em si. Os gastos nunca são apagados/movidos: eles só param de
// contar na "fatura em aberto" do Dashboard assim que o ciclo deles aparece
// aqui como pago.
export const uberCardStatements = pgTable("uber_card_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  card: text("card").notNull(),
  closingDate: date("closing_date", { mode: "string" }).notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
});

// Investimentos de capital pra colocar/manter a operação Uber rodando —
// diferente de despesa operacional (uber_expenses): não entra no resultado
// operacional do mês, é usado só pra acompanhar quanto capital já foi
// empregado no negócio (card "Investimento no negócio" do Dashboard) e,
// mais pra frente, pra calcular recuperação do investimento.
export const uberInvestments = pgTable("uber_investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull(),
  category: uberInvestmentCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  // Forma de pagamento (Pix, C6, Amazon, Mercado Pago...) — texto livre como em
  // uber_expenses.payment_method; null nos lançamentos antigos.
  paymentMethod: text("payment_method"),
  // Legado: antes guardava "como o carro foi obtido". A tela não usa mais esse
  // campo, mas a coluna fica pra não perder o histórico.
  vehicleOwnership: uberVehicleOwnershipEnum("vehicle_ownership"),
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

export const incomesRelations = relations(incomes, ({ one }) => ({
  category: one(categories, {
    fields: [incomes.categoryId],
    references: [categories.id],
  }),
  account: one(accounts, {
    fields: [incomes.accountId],
    references: [accounts.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const reservesRelations = relations(reserves, ({ one }) => ({
  goal: one(savingsGoals, {
    fields: [reserves.goalId],
    references: [savingsGoals.id],
  }),
}));
