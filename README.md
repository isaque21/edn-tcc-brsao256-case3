# Escola Tech: site de matrículas na AWS

Site estático de matrículas da Escola Tech, hospedado em EC2 com Auto Scaling atrás de um Application Load Balancer, em duas Availability Zones.

## Estrutura

```
site/                         Frontend (enviar para o bucket S3)
  index.html
  assets/css/styles.css
  assets/js/main.js
  assets/img/favicon.svg
infra/
  user-data.sh                Script de boot das instâncias (Launch Template)
  iam-policy-s3-read.json     Policy de leitura do bucket (IAM Role das instâncias)
docs/
  PASSO-A-PASSO-AWS.md        Guia completo de criação pelo Console AWS
```

## Ver o site localmente

```bash
cd site
python3 -m http.server 8080
```

Abra http://localhost:8080. O rodapé mostra "ambiente local" porque o arquivo `instance.json` só é gerado nas instâncias EC2.

## Free Tier e cobranças

Este case **pode gerar cobrança ou consumir créditos, mesmo no Free Tier**. Rodando 24 horas por dia, o ambiente custa cerca de **US$ 45/mês** em `us-east-1` (detalhes na seção 0.4 do [passo a passo](docs/PASSO-A-PASSO-AWS.md)). O que acontece na sua conta depende da data de criação dela, porque a AWS mudou o Free Tier em julho de 2025.

### Contas criadas a partir de 15/07/2025 (modelo atual)

A conta recebe US$ 100 em créditos e pode ganhar até mais US$ 100 completando atividades, como lançar uma instância EC2. Na criação, você escolhe um plano:

- **Free plan:** nada é cobrado. O uso é descontado dos créditos e o plano termina [após 6 meses ou quando os créditos acabarem](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html), o que ocorrer primeiro. Depois disso, é preciso migrar para o plano pago ou a conta é encerrada.
- **Paid plan:** os créditos são usados primeiro. Quando acabam, a cobrança começa.

Com o ambiente ligado o tempo todo, US$ 100 de créditos duram cerca de 2 meses e US$ 200 cerca de 4.

### Contas criadas antes de 15/07/2025 (modelo antigo, 12 meses)

Por 12 meses, cada mês inclui 750 h de t2/t3.micro, 750 h de ALB com 15 LCUs, 30 GB de EBS e [750 h de IPv4 público](https://aws.amazon.com/about-aws/whats-new/2024/02/aws-free-tier-750-hours-free-public-ipv4-addresses/). O case passa desses limites em alguns itens:

| Item | Uso no case | Excedente aproximado |
|---|---|---|
| EC2 t3.micro | ~1.100 h/mês (2 instâncias no horário comercial, 1 na madrugada) | ~350 h, cerca de US$ 3,60 |
| IPv4 público | O ALB usa 2 IPs, ~1.460 h/mês | Até ~US$ 3,50, se os IPs do ALB entrarem nas 750 h gratuitas |
| Monitoramento detalhado (opcional) | Habilitado no passo 5 do guia | Pode ser cobrado; deixe desativado para economizar |
| Teste de carga | O grupo pode chegar a 6 instâncias | As horas extras também contam |

Nesse modelo, o custo fica em poucos dólares por mês, mas não chega a zero. A regra exata para os IPs do ALB não foi confirmada; a página do Free Tier na sua conta mostra o uso real.

### Antes de começar e ao terminar

1. Em **Billing and Cost Management → Free Tier**, veja qual modelo e qual saldo de créditos a sua conta tem.
2. Em **Billing and Cost Management → Budgets → Create budget**, crie um orçamento de US$ 5 ou 10 com alerta por e-mail.
3. Ao terminar os testes, apague tudo seguindo a seção 14 (Limpeza) do guia. O ALB cobra por hora mesmo sem acessos.

## Observações

- O formulário de matrícula valida os campos e gera um protocolo no navegador, mas **não grava os dados** (o site é estático). Para persistir matrículas, é preciso um backend, por exemplo API Gateway + Lambda + DynamoDB.
- O endpoint `/health` (usado pelo health check do ALB) e o `/instance.json` são criados pelo `user-data.sh` em cada instância.
