# 前端動態網域配置測試 Script
# 這個 script 用於在本地環境測試 DOMAIN_NAME 環境變數功能

param(
    [string]$DomainName = "localhost:3001",
    [switch]$Dev = $false,
    [switch]$Build = $false,
    [switch]$Clean = $false
)

# 顯示使用說明
function Show-Usage {
    Write-Host "使用方式:" -ForegroundColor Yellow
    Write-Host "  .\test-domain-config.ps1 -DomainName 'api.example.com:3001'" -ForegroundColor Green
    Write-Host "  .\test-domain-config.ps1 -DomainName 'api.example.com:3001' -Dev" -ForegroundColor Green
    Write-Host "  .\test-domain-config.ps1 -Build" -ForegroundColor Green
    Write-Host "  .\test-domain-config.ps1 -Clean" -ForegroundColor Green
    Write-Host ""
    Write-Host "參數說明:" -ForegroundColor Yellow
    Write-Host "  -DomainName  : 要替換的目標網域 (預設: localhost:3001)"
    Write-Host "  -Dev         : 使用開發環境配置"
    Write-Host "  -Build       : 重新建構前端映像"
    Write-Host "  -Clean       : 清理所有容器和映像"
}

# 清理容器和映像
function Clean-Environment {
    Write-Host "正在清理 Docker 環境..." -ForegroundColor Yellow
    
    # 停止並移除容器
    docker-compose down --remove-orphans
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    
    # 移除相關映像
    docker rmi luckygo-frontend -f 2>$null
    docker rmi luckygo_luckygo-frontend -f 2>$null
    docker rmi luckygo_luckygo-frontend-dev -f 2>$null
    
    # 清理未使用的映像
    docker image prune -f
    
    Write-Host "清理完成！" -ForegroundColor Green
}

# 建構前端映像
function Build-Frontend {
    Write-Host "正在建構前端映像..." -ForegroundColor Yellow
    
    Push-Location frontend
    try {
        docker build -t luckygo-frontend .
        if ($LASTEXITCODE -eq 0) {
            Write-Host "前端映像建構完成！" -ForegroundColor Green
        } else {
            Write-Host "前端映像建構失敗！" -ForegroundColor Red
            exit 1
        }
    }
    finally {
        Pop-Location
    }
}

# 測試生產環境配置
function Test-Production {
    param([string]$Domain)
    
    Write-Host "測試生產環境配置..." -ForegroundColor Yellow
    Write-Host "目標網域: $Domain" -ForegroundColor Cyan
    
    # 設定環境變數
    $env:DOMAIN_NAME = $Domain
    
    # 啟動服務
    docker-compose up -d luckygo-frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "前端服務已啟動!" -ForegroundColor Green
        Write-Host "訪問地址: http://localhost" -ForegroundColor Cyan
        Write-Host "要停止服務，請執行: docker-compose down" -ForegroundColor Yellow
        
        # 顯示容器日誌
        Write-Host "`n查看啟動日誌:" -ForegroundColor Yellow
        docker logs luckygo-frontend --tail 20
    } else {
        Write-Host "服務啟動失敗！" -ForegroundColor Red
    }
}

# 測試開發環境配置
function Test-Development {
    param([string]$Domain)
    
    Write-Host "測試開發環境配置..." -ForegroundColor Yellow
    Write-Host "目標網域: $Domain" -ForegroundColor Cyan
    
    # 設定環境變數
    $env:DOMAIN_NAME = $Domain
    
    # 啟動開發服務
    docker-compose -f docker-compose.dev.yml up -d luckygo-frontend-dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "開發環境已啟動!" -ForegroundColor Green
        Write-Host "訪問地址: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "要停止服務，請執行: docker-compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
        
        # 顯示容器日誌
        Write-Host "`n查看啟動日誌:" -ForegroundColor Yellow
        docker logs luckygo-frontend-dev --tail 20
    } else {
        Write-Host "開發環境啟動失敗！" -ForegroundColor Red
    }
}

# 主要執行邏輯
Write-Host "=== 前端動態網域配置測試工具 ===" -ForegroundColor Green
Write-Host ""

# 檢查參數
if ($args.Contains("-h") -or $args.Contains("--help")) {
    Show-Usage
    exit 0
}

# 清理環境
if ($Clean) {
    Clean-Environment
    exit 0
}

# 建構映像
if ($Build) {
    Build-Frontend
}

# 執行測試
if ($Dev) {
    Test-Development -Domain $DomainName
} else {
    Test-Production -Domain $DomainName
}

Write-Host "`n測試完成！" -ForegroundColor Green
