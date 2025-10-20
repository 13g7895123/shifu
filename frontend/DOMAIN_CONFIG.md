# Frontend 動態域名配置

此功能允許在容器啟動時動態設定後端 API 的域名，而不需要重新建構映像檔。

## 功能概述

透過環境變數 `DOMAIN_NAME` 來動態替換前端程式中硬編碼的 `localhost:3001`。

## 檔案說明

### 1. entrypoint.sh (生產環境)
- 在 nginx 容器啟動時執行
- 搜尋並替換所有建構後的 JavaScript 檔案中的 `localhost:3001`
- 使用 sed 命令進行文字替換

### 2. entrypoint-dev.sh (開發環境)
- 在開發容器啟動時執行
- 動態創建 `.env.local` 檔案設定環境變數
- 啟動 React 開發伺服器

## 使用方式

### 方法 1: 使用 docker-compose（推薦）

#### 開發環境
```powershell
# 設定環境變數
$env:DOMAIN_NAME = "api.example.com:3001"

# 啟動開發環境
.\docker-scripts.bat dev
```

#### 生產環境
```powershell
# 設定環境變數
$env:DOMAIN_NAME = "api.production.com"

# 啟動生產環境
.\docker-scripts.bat
```

### 方法 2: 直接使用 docker 命令

#### 開發環境
```powershell
docker run -e DOMAIN_NAME="api.example.com:3001" -p 3000:3000 luckygo-frontend-dev
```

#### 生產環境
```powershell
docker run -e DOMAIN_NAME="api.production.com" -p 80:8080 luckygo-frontend
```

## 環境變數說明

| 變數名稱 | 預設值 | 說明 |
|---------|--------|------|
| `DOMAIN_NAME` | `localhost:3001` | 後端 API 的域名和端口 |

## 範例

### 範例 1: 本地開發
```powershell
# 使用預設值（localhost:3001）
.\docker-scripts.bat dev
```

### 範例 2: 連接到遠端 API
```powershell
# 連接到遠端開發環境
$env:DOMAIN_NAME = "dev-api.mycompany.com"
.\docker-scripts.bat dev
```

### 範例 3: 生產環境部署
```powershell
# 部署到生產環境
$env:DOMAIN_NAME = "api.mycompany.com"
.\docker-scripts.bat
```

## 注意事項

1. **域名格式**: 可以包含端口號，例如 `example.com:3001`
2. **協議**: 目前預設使用 HTTP 協議
3. **重建**: 更改 `DOMAIN_NAME` 不需要重建映像檔，只需重新啟動容器
4. **開發環境**: 支援 hot reload，更改會立即生效
5. **生產環境**: 需要重新啟動容器才能使更改生效

## 故障排除

### 檢查環境變數是否正確傳遞
```powershell
# 檢查容器內的環境變數
docker exec -it luckygo-frontend-dev printenv | grep DOMAIN_NAME
```

### 檢查替換是否成功（生產環境）
```powershell
# 檢查 JavaScript 檔案內容
docker exec -it luckygo-frontend grep -r "localhost:3001" /usr/share/nginx/html/
```

### 檢查 .env.local 檔案（開發環境）
```powershell
# 查看開發環境的環境設定
docker exec -it luckygo-frontend-dev cat /app/.env.local
```

## 技術實現

1. **生產環境**: 使用 sed 命令在容器啟動時替換已建構的檔案
2. **開發環境**: 動態創建 `.env.local` 檔案來覆蓋預設環境變數
3. **Docker 整合**: 透過 ENTRYPOINT 指令整合到 Docker 工作流程中
