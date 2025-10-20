# 前端動態網域配置使用說明

## 概述

這個 script (`frontend/entrypoint.sh`) 允許在容器啟動時動態替換前端應用中的 API 網域地址。

## 功能

- 在容器啟動時讀取 `DOMAIN_NAME` 環境變數
- 如果提供了 `DOMAIN_NAME`，會將所有靜態文件中的 `localhost:3001` 替換為指定的網域
- 支援 HTTP 和 HTTPS 協議
- 替換範圍包括：
  - JavaScript 文件 (`.js`)
  - JavaScript Source Map 文件 (`.js.map`)
  - HTML 文件 (`.html`)
  - CSS 文件 (`.css`)

## 使用方式

### 1. 使用 Docker Compose

#### 設定環境變數文件 (.env)
```bash
# 建立 .env 文件
echo "DOMAIN_NAME=api.yourcompany.com:3001" > .env
```

#### 啟動服務
```bash
# 使用 .env 文件中的環境變數啟動
docker-compose up -d

# 或直接指定環境變數
DOMAIN_NAME=api.yourcompany.com:3001 docker-compose up -d
```

### 2. 使用 Docker 直接執行

```bash
# 建構前端映像
docker build -t luckygo-frontend ./frontend

# 執行容器並設定網域
docker run -e DOMAIN_NAME=api.yourcompany.com:3001 -p 80:8080 luckygo-frontend
```

### 3. 在 Kubernetes 中使用

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: luckygo-frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: luckygo-frontend:latest
        env:
        - name: DOMAIN_NAME
          value: "api.yourcompany.com:3001"
        # 或從 ConfigMap/Secret 中讀取
        - name: DOMAIN_NAME
          valueFrom:
            configMapKeyRef:
              name: luckygo-config
              key: api-domain
```

## 範例

### 範例 1: 本地開發
```bash
# 使用預設值 (localhost:3001)
docker-compose -f docker-compose.dev.yml up

# 或使用自訂網域
DOMAIN_NAME=localhost:3001 docker-compose -f docker-compose.dev.yml up
```

### 範例 2: 測試環境
```bash
DOMAIN_NAME=test-api.yourcompany.com docker-compose up -d
```

### 範例 3: 生產環境
```bash
DOMAIN_NAME=api.yourcompany.com docker-compose up -d
```

## 日誌輸出

容器啟動時會輸出以下資訊：
```
=== Frontend Entrypoint Script ===
目標網域: api.yourcompany.com:3001
預設網域: localhost:3001
==================================
正在替換 localhost:3001 為 api.yourcompany.com:3001...
網域替換完成！
已將所有靜態文件中的 localhost:3001 替換為 api.yourcompany.com:3001
正在啟動 nginx...
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
nginx 配置驗證成功
```

## 注意事項

1. **環境變數格式**: `DOMAIN_NAME` 應包含主機名和端口號（如果需要），例如：
   - `api.example.com`
   - `api.example.com:8080`
   - `192.168.1.100:3001`

2. **協議支援**: Script 會同時替換 HTTP 和 HTTPS 的 URL

3. **容器重啟**: 每次容器重啟時都會重新執行替換操作

4. **開發環境**: 在開發環境中，通常不需要設定 `DOMAIN_NAME`，因為 React 開發伺服器會使用環境變數

## 故障排除

### 問題 1: 替換沒有生效
- 檢查 `DOMAIN_NAME` 環境變數是否正確設定
- 查看容器日誌確認替換操作是否執行

### 問題 2: nginx 啟動失敗
- 檢查 nginx 配置文件語法
- 確認端口 8080 沒有被其他服務占用

### 問題 3: API 請求失敗
- 確認後端服務正在運行且可訪問
- 檢查網路連接和防火牆設定
- 驗證 CORS 設定是否允許前端網域
