#!/bin/bash

# 快速設定腳本 - luckygo 前後端分離架構

echo "🚀 luckygo 專案設定開始..."

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

# 檢查 Docker Compose 是否可用（新版 plugin 或舊版 docker-compose）
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
    exit 1
fi

# 創建環境變數文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 創建環境變數文件..."
    cp .env.example .env
    echo "✅ 已創建 .env 文件，請根據需要修改設定"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 創建前端環境變數文件..."
    echo "REACT_APP_API_URL=http://localhost:3001" > frontend/.env
    echo "✅ 已創建前端 .env 文件"
fi

echo "🐳 啟動開發環境..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "🎉 設定完成！"
echo ""
echo "📱 前端應用: http://localhost:3000"
echo "🔧 後端API: http://localhost:3001"
echo "📊 API健康檢查: http://localhost:3001/health"
echo "🗄️ Redis Commander: http://localhost:8081"
echo ""
echo "停止服務請運行: docker compose -f docker-compose.dev.yml down"
