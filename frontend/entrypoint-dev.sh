#!/bin/bash

# 設定預設值
DEFAULT_DOMAIN="localhost:3001"
DOMAIN_NAME=${DOMAIN_NAME:-$DEFAULT_DOMAIN}

echo "=== Frontend Development Entrypoint Script ==="
echo "DOMAIN_NAME: $DOMAIN_NAME"
echo "==============================================="

# 創建或更新 .env.local 檔案
echo "正在設定環境變數..."
cat > /app/.env.local << EOF
REACT_APP_API_URL=http://$DOMAIN_NAME
REACT_APP_SERVER_URL=http://$DOMAIN_NAME
EOF

echo "環境變數設定完成："
cat /app/.env.local

# 啟動 React 開發伺服器
echo "啟動 React 開發伺服器..."
exec npm start
