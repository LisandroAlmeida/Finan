# Backlog

Lista de ideias e melhorias futuras pro app. Itens concluídos saem daqui e viram
parte do histórico de commits — isso aqui é só o que ainda está pra fazer.

## Em andamento / próximos passos

- **Aba Uber Drive**: controle de ganhos e gastos de rodar como motorista de
  app (Uber/99), separado da categoria "App/Uber" que já existe em Gastos
  (essa é só pra corridas como passageiro). Baseado numa planilha pessoal com:
  - `Lançamentos`: gastos gerais do carro (categoria, descrição, valor, forma
    de pagamento)
  - `Combustível`: abastecimentos (data, tipo, valor, km do abastecimento,
    litros — calcula Km/L e R$/Km sozinho a partir do abastecimento anterior)
  - `Ganhos`: corridas por dia (plataforma, km inicial/final, horas
    trabalhadas, viagens, pontos, valor, promoção, gorjeta/extras, bônus)
  - `Resumo Mensal`: totais por categoria de gasto + total de ganhos + lucro
    líquido, por mês
  - `Despesas do carro` e `Financiamento`: parcelas fixas (revisão, seguro,
    financiamento do veículo) com status pago/pendente
  - Requisito: arquitetura isolada, sem alterar as tabelas já existentes do
    app (accounts/expenses/bills/incomes) — ver decisão de design abaixo.

## Ideias sem prioridade definida ainda

_(nada por enquanto — itens novos entram aqui conforme surgem)_

## Concluído recentemente

- Corrigido bug antigo do campo "Validade" do cartão (07/09/2026)
- Agrupamento de cartões adicionais (expansível por clique)
- Forma de pagamento (Pix/Boleto) nas contas
- Correção de duplicidade de gasto de cartão no Dashboard + breakdown por cartão
- Editar fatura do mês (além de excluir)
- Ajustes de layout: largura da tabela de faturas, reorganização do Dashboard,
  padronização da largura de todas as páginas com o menu
- Menu: remoção do item "Categorias" (continua acessível pelo link "+ nova")
