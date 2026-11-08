#!/bin/bash
# =============================================================================
# Escola Tech - User data do Launch Template (Amazon Linux 2023)
#
# Executado uma vez, como root, no primeiro boot de cada instância criada
# pelo Auto Scaling. Instala o Apache, baixa o site do S3 e cria o endpoint
# de health check usado pelo Target Group do ALB.
#
# ANTES DE COLAR NO LAUNCH TEMPLATE: troque o valor de BUCKET abaixo.
# Log da execução na instância: /var/log/cloud-init-output.log
# =============================================================================
set -euo pipefail

BUCKET="SUBSTITUA-PELO-NOME-DO-BUCKET"
WEB_ROOT="/var/www/html"

if [[ "$BUCKET" == SUBSTITUA* ]]; then
  echo "ERRO: defina a variavel BUCKET no user data." >&2
  exit 1
fi

# --- Metadados da instância (IMDSv2) ---
TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
md() {
  curl -fsS -H "X-aws-ec2-metadata-token: ${TOKEN}" \
    "http://169.254.169.254/latest/meta-data/$1"
}
INSTANCE_ID=$(md instance-id)
AZ=$(md placement/availability-zone)
REGION=$(md placement/region)
PRIVATE_IP=$(md local-ipv4)
INSTANCE_TYPE=$(md instance-type)

# --- Apache ---
# Os repositórios do AL2023 ficam no S3, então o dnf funciona pela
# VPC Gateway Endpoint de S3, sem NAT Gateway.
dnf install -y httpd

cat > /etc/httpd/conf.d/escolatech.conf <<'EOF'
ServerTokens Prod
ServerSignature Off

<Directory "/var/www/html">
    Options -Indexes
    AllowOverride None
</Directory>

<Location "/instance.json">
    Header set Cache-Control "no-store"
</Location>

<Location "/health">
    Header set Cache-Control "no-store"
</Location>
EOF

# --- Site a partir do S3 (com novas tentativas) ---
for attempt in 1 2 3 4 5; do
  if aws s3 sync "s3://${BUCKET}/" "${WEB_ROOT}/" --region "${REGION}" --delete --only-show-errors; then
    break
  fi
  echo "aws s3 sync falhou (tentativa ${attempt}), aguardando..." >&2
  sleep $((attempt * 5))
  [[ $attempt -eq 5 ]] && exit 1
done

# --- Dados exibidos no rodapé do site ---
cat > "${WEB_ROOT}/instance.json" <<EOF
{
  "instanceId": "${INSTANCE_ID}",
  "availabilityZone": "${AZ}",
  "privateIp": "${PRIVATE_IP}",
  "instanceType": "${INSTANCE_TYPE}",
  "bootedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# --- Health check: criado por último, só existe se tudo acima deu certo ---
echo "OK" > "${WEB_ROOT}/health"

chown -R apache:apache "${WEB_ROOT}"
systemctl enable --now httpd
