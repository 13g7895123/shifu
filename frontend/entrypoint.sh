#!/bin/bash

# 設定預設值
DEFAULT_DOMAIN="localhost:3001"
DEFAULT_API_URL="http://localhost:3001"

# 優先使用 BACKEND_API_URL，若無則使用 DOMAIN_NAME
if [ -n "$BACKEND_API_URL" ]; then
    TARGET_API_URL="$BACKEND_API_URL"
    # 從完整 URL 提取 domain（移除 http:// 或 https://）
    TARGET_DOMAIN=$(echo "$BACKEND_API_URL" | sed -E 's|https?://||')
else
    TARGET_DOMAIN="${DOMAIN_NAME:-$DEFAULT_DOMAIN}"
    TARGET_API_URL="http://$TARGET_DOMAIN"
fi

echo "=== Frontend Entrypoint Script ==="
echo "目標 API URL: $TARGET_API_URL"
echo "目標網域: $TARGET_DOMAIN"
echo "預設網域: $DEFAULT_DOMAIN"
echo "=================================="

# 如果 BACKEND_API_URL 或 DOMAIN_NAME 環境變數存在且不同於預設值，則進行替換
if ([ -n "$BACKEND_API_URL" ] && [ "$BACKEND_API_URL" != "$DEFAULT_API_URL" ]) || ([ -n "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "$DEFAULT_DOMAIN" ]); then
    echo "正在替換 $DEFAULT_API_URL 為 $TARGET_API_URL..."

    # 替換所有 JavaScript 文件中的 localhost:3001 (支援 http 和 https)
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|http://localhost:3001|$TARGET_API_URL|g" {} \;
    find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|https://localhost:3001|$TARGET_API_URL|g" {} \;
    
    # 替換所有 JavaScript map 文件中的 localhost:3001
    find /usr/share/nginx/html -name "*.js.map" -type f -exec sed -i "s|http://localhost:3001|$TARGET_API_URL|g" {} \;
    find /usr/share/nginx/html -name "*.js.map" -type f -exec sed -i "s|https://localhost:3001|$TARGET_API_URL|g" {} \;

    # 替換 HTML 文件中可能的 localhost:3001
    find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|http://localhost:3001|$TARGET_API_URL|g" {} \;
    find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|https://localhost:3001|$TARGET_API_URL|g" {} \;

    # 替換 CSS 文件中可能的 localhost:3001
    find /usr/share/nginx/html -name "*.css" -type f -exec sed -i "s|http://localhost:3001|$TARGET_API_URL|g" {} \;
    find /usr/share/nginx/html -name "*.css" -type f -exec sed -i "s|https://localhost:3001|$TARGET_API_URL|g" {} \;

    echo "API URL 替換完成！"
    echo "已將所有靜態文件中的 $DEFAULT_API_URL 替換為 $TARGET_API_URL"
else
    echo "無需進行 API URL 替換，使用預設 API URL: $DEFAULT_API_URL"
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
