# 💰 FinancesPro

Aplicativo PWA de controle financeiro pessoal, feito para funcionar no celular como um app instalado.

## ✅ Funcionalidades

- **Lançamento de despesas** com descrição, valor, data, categoria e parcelas
- **Data de vencimento** com alertas automáticos (vencida, hoje, amanhã, em 3 dias)
- **Categorias** com ícones: Moradia, Mercado, Transporte, Lazer, Cartão, Saúde, Assinaturas e Investimentos
- **Marcar como pago** diretamente na lista
- **Parcelas** — divide automaticamente em até 24x, distribuindo pelos meses
- **Filtro por categoria** e **busca por nome**
- **Navegação por mês** com resumo de pagas, total, pendentes e cartão pendente
- **Barra de progresso** mostrando quantas despesas foram pagas
- **Exportar PDF** do mês com relatório completo
- **Selecionar e excluir** múltiplos itens de uma vez
- **Notificações push** de vencimentos (requer permissão)
- **Sincronização em nuvem** via Firebase (dados salvos por usuário)
- **Login e cadastro** com usuário e senha
- **Funciona offline** via Service Worker com cache automático
- **Instalável** como PWA no Android e iOS

## 🚀 Acesse

👉 [https://boybearboom.github.io/meu-financeiro/](https://boybearboom.github.io/meu-financeiro/)

**Formas de adicionar despesas**

**Direto — cadastra sem perguntar:**
- `netflix 24,90` / `netflix de r$ 24,90`
- `ração 160,99` / `ração dos gatos 160,99`
- `comprei tênis 200` / `gastei 350 no mercado`
- `aluguel 1200 vence dia 10`
- `cartão nubank 500 em 3x`
- `adicionar assinatura netflix 24,90`
- `luz 85,50` / `farmácia 45`

**Com diálogo — pergunta o que falta:**
- `adicionar conta da netflix` → pergunta o valor
- `comprei tênis` → pergunta o valor
- `gastei no cartão de crédito 200` → pergunta qual cartão
- `paguei 150` → pergunta o que foi

**Consultas — não cadastra, só informa:**
- `quais pendentes` / `contas pendentes de março`
- `o que já paguei` / `o que paguei em março`
- `quanto gastei esse mês` / `total do mês`
- `maior despesa` / `menor despesa`
- `gastos por categoria`
- `quanto falta pagar`
- `compare com mês passado`
- `minha média de gastos`
- `próximos vencimentos`

**Pagar uma conta:**
- `pagar netflix` → confirma e marca como pago
- `quais pendentes` → lista e pergunta se quer pagar a primeira

**Formatos de valor aceitos:**
- Com vírgula: `24,90` / `160,99` / `1.200,00`
- Com ponto: `24.90`
- Inteiro: `150` / `1200`
- Com R$: `r$ 150` / `r$24,90`
- Com palavras: `150 reais` / `160 pila` / `2 conto`
- Em frase: `deu 150` / `custou 24,90` / `foi 200` / `de 150`
