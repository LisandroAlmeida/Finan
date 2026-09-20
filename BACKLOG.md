# Backlog

Lista de ideias e melhorias futuras pro app. Itens concluídos saem daqui e viram
parte do histórico de commits — isso aqui é só o que ainda está pra fazer.

## Em andamento / próximos passos

- **Uber Drive — fase 2 (Despesas do carro / Financiamento)**: parcelas fixas
  do carro (revisão, seguro, financiamento do veículo) com status
  pago/pendente, espelhando as abas `Despesas do carro` e `Financiamento` da
  planilha original. Ainda dentro da mesma arquitetura isolada (tabelas
  próprias, sem tocar accounts/expenses/bills/incomes). A ideia é uma tabela
  tipo `uber_installments` (descrição, valor da parcela, nº de parcelas,
  data de início, status pago/pendente por mês).
- **Resumo Mensal do Uber**: hoje o dashboard `/uber` já mostra lucro
  líquido, gastos por categoria e resumo do mês (km, dias, ganho/km) — falta
  avaliar se algo da aba `Resumo Mensal`/`Resumo` da planilha original
  (comparativo entre meses, por exemplo) ainda faz falta depois de usar o
  app por um tempo.

## Ideias sem prioridade definida ainda

_(nada por enquanto — itens novos entram aqui conforme surgem)_

## Concluído recentemente

- **Aba Uber Drive (fase 1)**: nova seção "Uber" no menu, com submenu
  (Dashboard/Ganhos/Combustível/Lançamentos), separada da categoria
  "App/Uber" de Gastos (que continua sendo só corridas como passageiro).
  Dashboard próprio (lucro líquido, gastos por categoria, km/dias rodados)
  + lançamento rápido do dia (km inicial/final + abastecimento) direto na
  tela do dashboard. Km/L e R$/Km calculados automaticamente comparando com
  o abastecimento anterior, igual a planilha original. Arquitetura
  totalmente isolada: tabelas próprias (`uber_earnings`, `uber_expenses`),
  sem nenhuma referência às tabelas existentes (accounts/expenses/bills/
  incomes) — confirmado que o Dashboard principal não mostra nada do Uber.
- Corrigido bug antigo do campo "Validade" do cartão (07/09/2026)
- Agrupamento de cartões adicionais (expansível por clique)
- Forma de pagamento (Pix/Boleto) nas contas
- Correção de duplicidade de gasto de cartão no Dashboard + breakdown por cartão
- Editar fatura do mês (além de excluir)
- Ajustes de layout: largura da tabela de faturas, reorganização do Dashboard,
  padronização da largura de todas as páginas com o menu
- Menu: remoção do item "Categorias" (continua acessível pelo link "+ nova")
