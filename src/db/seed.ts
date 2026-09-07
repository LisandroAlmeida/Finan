import "dotenv/config";
import { db } from "./index";
import { categories, accounts, incomes, bills, expenses, reserves, goals } from "./schema";

const MONTH = "2026-08-01";

async function main() {
  console.log("Seed: limpando tabelas...");
  await db.delete(expenses);
  await db.delete(bills);
  await db.delete(incomes);
  await db.delete(reserves);
  await db.delete(goals);
  await db.delete(accounts);
  await db.delete(categories);

  console.log("Seed: categorias...");
  const [contas, eletronicos, restaurante, mercado, assinaturasCat, pet, educacao, saude, telefone, transporte] =
    await db
      .insert(categories)
      .values([
        { name: "Contas", color: "#334155" },
        { name: "Eletrônicos", color: "#B45309" },
        { name: "Restaurante", color: "#DC2626" },
        { name: "Mercado", color: "#059669" },
        { name: "Assinaturas", color: "#2563EB" },
        { name: "Pet", color: "#7C3AED" },
        { name: "Educação", color: "#0891B2" },
        { name: "Saúde e Bem-estar", color: "#DB2777" },
        { name: "Plano Telefone", color: "#65A30D" },
        { name: "Uber/InDrive", color: "#111827" },
      ])
      .returning();

  console.log("Seed: contas e cartões...");
  const [bradesco, mp, amazon, nubank, internetMae, condominio, caixaApto, dizimo, energia, txLixo] =
    await db
      .insert(accounts)
      .values([
        { name: "Bradesco", bank: "bradesco", type: "cartao", dueDay: 8, lastFourDigits: "4821", expiryMonth: 11, expiryYear: 2028 },
        { name: "MP", bank: "mercadopago", type: "conta", dueDay: 11 },
        { name: "Amazon", bank: "amazon", type: "cartao", dueDay: 28, lastFourDigits: "7734", expiryMonth: 3, expiryYear: 2029 },
        { name: "Nubank", bank: "nubank", type: "cartao", dueDay: 7, lastFourDigits: "1092", expiryMonth: 6, expiryYear: 2030 },
        { name: "Internet Mãe", bank: "outro", type: "conta", dueDay: 7 },
        { name: "Condominio", bank: "outro", type: "conta", dueDay: 10 },
        { name: "Caixa Apto", bank: "caixa", type: "conta", dueDay: 11 },
        { name: "Dízimo", bank: "outro", type: "conta", dueDay: 6 },
        { name: "Energia", bank: "outro", type: "conta", dueDay: 10 },
        { name: "Tx Lixo", bank: "outro", type: "conta", dueDay: 14 },
      ])
      .returning();

  console.log("Seed: entradas...");
  await db.insert(incomes).values([{ description: "Lisandro", amount: "5050.00", month: MONTH }]);

  console.log("Seed: faturas do mês...");
  await db.insert(bills).values([
    { accountId: bradesco.id, month: MONTH, plannedAmount: "2880.27", actualAmount: "2880.27", paid: true, paidAt: "2026-08-08" },
    { accountId: mp.id, month: MONTH, plannedAmount: "77.50", actualAmount: "77.50", paid: true, paidAt: "2026-08-11" },
    { accountId: amazon.id, month: MONTH, plannedAmount: "237.44", actualAmount: "237.44", paid: true, paidAt: "2026-08-28" },
    { accountId: nubank.id, month: MONTH, plannedAmount: "118.45", actualAmount: "118.45", paid: true, paidAt: "2026-08-07" },
    { accountId: internetMae.id, month: MONTH, plannedAmount: "115.00", actualAmount: "115.00", paid: true, paidAt: "2026-08-07" },
    { accountId: condominio.id, month: MONTH, plannedAmount: "1356.11", actualAmount: "1356.11", paid: true, paidAt: "2026-08-10" },
    { accountId: caixaApto.id, month: MONTH, plannedAmount: "2166.28", actualAmount: "2163.88", paid: true, paidAt: "2026-08-11" },
    { accountId: dizimo.id, month: MONTH, plannedAmount: "505.00", actualAmount: "505.00", paid: true, paidAt: "2026-08-06" },
    { accountId: energia.id, month: MONTH, plannedAmount: "243.99", actualAmount: "243.99", paid: true, paidAt: "2026-08-10" },
    { accountId: txLixo.id, month: MONTH, plannedAmount: "22.38", actualAmount: "22.38", paid: true, paidAt: "2026-08-14" },
  ]);

  console.log("Seed: gastos...");
  await db.insert(expenses).values([
    { categoryId: contas.id, accountId: bradesco.id, amount: "249.36", date: "2026-08-06", month: MONTH, essential: true },
    { categoryId: eletronicos.id, accountId: bradesco.id, amount: "77.50", date: "2026-08-03", month: MONTH, essential: false },
    { categoryId: restaurante.id, accountId: nubank.id, amount: "26.07", date: "2026-07-30", month: MONTH, essential: false },
    { categoryId: mercado.id, accountId: nubank.id, amount: "89.27", date: "2026-07-30", month: MONTH, essential: true },
    { categoryId: mercado.id, accountId: nubank.id, amount: "4.96", date: "2026-08-01", month: MONTH, essential: true },
    { categoryId: assinaturasCat.id, accountId: bradesco.id, amount: "13.50", date: "2026-08-05", month: MONTH, essential: false },
    { categoryId: pet.id, accountId: bradesco.id, amount: "95.00", date: "2026-08-06", month: MONTH, essential: false },
    { categoryId: mercado.id, accountId: nubank.id, amount: "6.23", date: "2026-08-09", month: MONTH, essential: true },
    { categoryId: educacao.id, accountId: bradesco.id, amount: "30.70", date: "2026-07-30", month: MONTH, essential: true },
    { categoryId: restaurante.id, accountId: bradesco.id, amount: "28.36", date: "2026-08-05", month: MONTH, essential: false },
  ]);
  // categorias sem gasto ainda nesse mês de exemplo, só pra existirem no cadastro
  void saude;
  void telefone;
  void transporte;

  console.log("Seed: reservas e metas...");
  await db.insert(reserves).values([
    { name: "Reserva de emergência acumulada", type: "Reserva de emergência", amount: "26181.79", date: "2026-01-15" },
  ]);
  await db.insert(goals).values([
    { key: "reserva_emergencia", targetAmount: "10000.00", month: MONTH },
    { key: "aumento_renda", targetAmount: "5000.00", month: MONTH },
  ]);

  console.log("Seed concluído ✅");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
