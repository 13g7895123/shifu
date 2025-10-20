#!/bin/bash

# 設定預設值
DEFAULT_DOMAIN="localhost:3001"
TARGET_DOMAIN="${DOMAIN_NAME:-$DEFAULT_DOMAIN}"

echo "=== Frontend Entrypoint Script ==="
echo "目標網域: $TARGET_DOMAIN"
echo "預設網域: $DEFAULT_DOMAIN"
echo "=================================="

# 如果 DOMAIN_NAME 環境變數存在且不同於預設值，則進行替換
if [ -n "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "$DEFAULT_DOMAIN" ]; then
    echo "正在替換 $DEFAULT_DOMAIN 為 $TARGET_DOMAIN..."
    
    # 替換所有 JavaScript 文件中的 localhost:3001 (支援 http 和 https)
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|http://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|https://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    
    # 替換所有 JavaScript map 文件中的 localhost:3001
    find /usr/share/nginx/html -name "*.js.map" -type f -exec sed -i "s|http://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    find /usr/share/nginx/html -name "*.js.map" -type f -exec sed -i "s|https://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    
    # 替換 HTML 文件中可能的 localhost:3001
    find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|http://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|https://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    
    # 替換 CSS 文件中可能的 localhost:3001
    find /usr/share/nginx/html -name "*.css" -type f -exec sed -i "s|http://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    find /usr/share/nginx/html -name "*.css" -type f -exec sed -i "s|https://localhost:3001|https://$TARGET_DOMAIN|g" {} \;
    
    echo "網域替換完成！"
    echo "已將所有靜態文件中的 $DEFAULT_DOMAIN 替換為 $TARGET_DOMAIN"
else
    echo "無需進行網域替換，使用預設網域: $DEFAULT_DOMAIN"
fi

echo "正在啟動 nginx..."

# 驗證 nginx 配置
nginx -t

if [ $? -eq 0 ]; then
    echo "nginx 配置驗證成功"
    # 啟動 nginx
    exec nginx -g "daemon off;"
else
    echo "nginx 配置驗證失敗"
    exit 1
fi
