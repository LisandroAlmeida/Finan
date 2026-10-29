/**
 * O servidor (Vercel) roda em UTC; depois das 21h em São Paulo o "hoje" de UTC
 * já é o dia seguinte. Toda decisão de "hoje" / "mês atual" do app passa por aqui
 * para sempre usar o horário de Brasília.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

const saoPauloDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data de hoje em São Paulo no formato "YYYY-MM-DD". */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return saoPauloDateFormatter.format(now);
}
