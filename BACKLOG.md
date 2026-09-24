# Backlog

Lista de ideias e melhorias futuras pro app. Itens concluídos saem daqui e viram
parte do histórico de commits — isso aqui é só o que ainda está pra fazer.

## Em andamento / próximos passos

_(nada em aberto no momento — próximos itens entram aqui conforme surgem)_

## Ideias sem prioridade definida ainda

_(nada por enquanto — itens novos entram aqui conforme surgem)_

## Concluído recentemente

- **Uber Drive — Gastos por cartão no Dashboard (fase 7)**: novo card
  "Gastos por cartão" no Dashboard do mês, com o mesmo gráfico de rosca +
  lista que "Gastos por categoria" já tinha — agora com valor e % junto
  (isso ficou pra categoria também, de graça, já que é o mesmo componente).
  Cor de cada cartão é atribuída sozinha (ordem alfabética), já que
  cartão é texto livre, não tem uma lista fixa.
- **Uber Drive — Cartão como filtro/relatório (fase 6)**: pensado pra dar
  visibilidade da aba "Cartões" que você adicionou na planilha (Mercado
  Pago, Amazon, C6...). Como tudo dali é gasto de verdade (não tem "é do
  carro"/"não é" — combina com o que você confirmou), não criou tabela
  nova nem mudou o banco: aproveitou o campo "Forma Pag" que Lançamentos já
  tinha (sem uso em Combustível ainda) pra virar a etiqueta do cartão em
  qualquer categoria.
  - `Combustível` ganhou o campo "Cartão/Forma pag" (cadastro e edição),
    igual Lançamentos já tinha — assim dá pra marcar em qual cartão foi
    cada abastecimento, sem duplicar o lançamento que já existe.
  - `Resumo` ganhou uma tabelinha "Total em {ano} por cartão/forma de
    pagamento", somando todos os gastos do ano (qualquer categoria) por
    valor de "Forma Pag" — dá o total gasto em cada cartão que você
    pediu, sem precisar de tela/relatório separado.
  - Categorias que não existem no app (ex: "Mk Kobrasol", "Vídeos IA")
    entram em Lançamentos como "Outros", com o nome original guardado na
    Descrição — nada se perde, só não vira categoria própria.
- **Uber Drive — Dashboard: Lançamento rápido ao lado do Resumo do mês**:
  linha de cima voltou a ser Lucro líquido final/Lucro operacional/Gastos
  por categoria (como era antes); "Resumo do mês" saiu dessa grade e foi
  pra uma linha abaixo, lado a lado com "Lançamento rápido do dia" (que
  antes ocupava a largura toda sozinho).
- **Uber Drive — Lucro Operacional separado do Lucro Líquido (fase 5)**:
  Financiamento e Seguro são custo fixo de posse do carro (existem
  independente de rodar ou não), diferente de Combustível/Manutenção/
  Lavagem/Pedágio/etc, que escalam com o uso. Agora o Dashboard mostra dois
  números lado a lado: "Lucro Operacional" (só ganhos menos custo de
  operação, sem financiamento/seguro) e "Lucro Líquido Final" (com tudo,
  igual antes). O Resumo anual ganhou a coluna "Lucro Operacional" também,
  ao lado de "Lucro Líquido". Não mudou nada no banco, só como os totais já
  existentes são somados/exibidos.
- **Uber Drive — Financiamento com todas as parcelas visíveis (fase 4)**:
  - Novo campo "Valor original do carro" (só informativo, não entra na conta
    do total projetado), mostrado à esquerda de "Entrada".
  - A tela de Financiamento deixou de depender do seletor de mês: agora
    lista as 48 parcelas de uma vez (Parcela/Vencimento/Valor original/Valor
    pago/Data pagamento/Economia/Status), cada uma com seu próprio "marcar
    pago"/"editar"/"desfazer" — dá pra pagar/corrigir qualquer parcela sem
    precisar navegar mês a mês até chegar nela.
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
