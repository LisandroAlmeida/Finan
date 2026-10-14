// Estilo comum dos gráficos (Recharts) usando os tokens do tema claro/escuro.
export const TOOLTIP_PROPS = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--foreground)",
  },
  itemStyle: { color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
  cursor: { fill: "var(--muted)", opacity: 0.5 },
} as const;

export const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" } as const;
