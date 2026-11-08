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

## Observações

- O formulário de matrícula valida os campos e gera um protocolo no navegador, mas **não grava os dados** (o site é estático). Para persistir matrículas, é preciso um backend, por exemplo API Gateway + Lambda + DynamoDB.
- O endpoint `/health` (usado pelo health check do ALB) e o `/instance.json` são criados pelo `user-data.sh` em cada instância.
