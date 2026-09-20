# Backlog

Lista de ideias e melhorias futuras pro app. Itens concluídos saem daqui e viram
parte do histórico de commits — isso aqui é só o que ainda está pra fazer.

## Em andamento / próximos passos

_(nada em aberto no momento — próximos itens entram aqui conforme surgem)_

## Ideias sem prioridade definida ainda

_(nada por enquanto — itens novos entram aqui conforme surgem)_

## Concluído recentemente

- **Uber Drive — Financiamento/Despesas do carro repensados (fase 3)**, pra
  bater com o jeito que a planilha original organizava as coisas:
  - `Lançamentos` agora é só o dia a dia lançado manualmente (lavagem,
    pedágio, alimentação...). Pagamentos gerados por "marcar como pago" em
    Despesas do carro/Financiamento não aparecem mais nessa lista — mas
    continuam entrando nos totais de Resumo/Dashboard normalmente.
  - `Despesas do carro` ganhou parcelamento opcional: além do modo recorrente
    indefinido (ex: seguro mensal), dá pra cadastrar algo com nº fixo de
    parcelas (ex: revisão em 10x), que aparece com o número da parcela do mês
    calculado sozinho, igual ao Financiamento.
  - `Financiamento` virou uma tela dedicada ao financiamento do carro: mostra
    Entrada, Qtd. de parcelas, Valor original da parcela, Total original das
    parcelas e Total projetado do carro (entrada + parcelas), além de quantas
    parcelas já foram pagas e quanto foi economizado pagando antecipado (soma
    da diferença entre o valor original da parcela e o valor realmente pago).
  - Pagamentos de Despesas do carro/Financiamento agora podem ser corrigidos
    (data/valor) direto na própria tela, sem precisar passar por Lançamentos.
- **Uber Drive — abas restantes (fase 2)**: submenu completo agora com
  Despesas do carro, Financiamento e Resumo, além de Dashboard/Ganhos/
  Combustível/Lançamentos.
  - `Despesas do carro`: cadastro de despesas fixas recorrentes (revisão,
    seguro, IPVA...) com status pago/pendente por mês — "marcar como pago"
    já cria o gasto de verdade em Lançamentos.
  - `Financiamento`: parcelas do veículo com valor fixo — o número da
    parcela (ex: 9/48) é calculado sozinho a partir da data de início, sem
    precisar cadastrar mês a mês. "Marcar como pago" também gera o gasto
    (categoria Financiamento) vinculado à parcela.
  - `Resumo`: comparativo mês a mês do ano (Combustível, Manutenção,
    Lavagem, Seguro, IPVA, Financiamento, Pedágio, Internet, Alimentação,
    Outros + Total Gastos/Ganhos/Lucro Líquido), com seletor de ano e linha
    de Total Anual — espelha a aba "Resumo Mensal" da planilha original.
  - Ainda dentro da arquitetura isolada: duas tabelas novas
    (`uber_fixed_expenses`, `uber_financings`) + colunas de vínculo opcional
    em `uber_expenses` (fixedExpenseId/financingId/parcelaNumero), sem
    nenhuma referência às tabelas da casa.
- **Nav do Uber**: item "Uber" confirmado à direita de "Reservas" no menu
  principal.
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
