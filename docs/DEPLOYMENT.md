# LuckyGo 正式環境部署指南

## 前置需求

### 系統需求
- Docker 20.10 或更新版本
- Docker Compose V2 (plugin) 或更新版本
  - 新版語法：`docker compose`（推薦）
  - 舊版語法：`docker-compose`（仍支援，但建議升級）
- 至少 2GB 可用記憶體
- 至少 10GB 可用磁碟空間

### 網路需求
- 開放 port 80 (HTTP)
- 開放 port 443 (HTTPS，如果使用 SSL)
- 開放 port 3001 (後端 API)
- 開放 port 6379 (Redis，僅內部網路)

---

## 快速部署（不含 SSL）

### 1. 準備環境變數

複製環境變數範本並編輯：

```bash
cp .env.docker .env
```

**必須修改以下安全性相關設定：**

```bash
# 編輯 .env 檔案
REDIS_PASSWORD=<請設定強密碼>
SESSION_SECRET=<請設定隨機字串>
JWT_SECRET=<請設定隨機字串>
NODE_ENV=production
```

### 2. 執行部署

使用部署腳本：

```bash
chmod +x docker-scripts.sh
./docker-scripts.sh prod:up
```

或使用 npm：

```bash
npm run docker:prod
```

### 3. 驗證部署

檢查服務狀態：

```bash
./docker-scripts.sh status
```

測試服務：

```bash
# 檢查前端
curl http://localhost

# 檢查後端 API 健康狀態
curl http://localhost:3001/health
```

---

## 完整部署（含 SSL/HTTPS）

### 1. 準備 SSL 憑證

建立 SSL 憑證目錄：

```bash
mkdir -p ssl
```

將您的 SSL 憑證放入 `ssl` 目錄：

```
ssl/
├── cert.pem      # SSL 憑證
└── key.pem       # 私鑰
```

#### 使用 Let's Encrypt（推薦）

```bash
# 安裝 certbot
sudo apt-get install certbot

# 取得憑證
sudo certbot certonly --standalone -d your-domain.com

# 複製憑證到專案目錄
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem
```

### 2. 設定網域

編輯 `.env` 檔案：

```bash
DOMAIN_NAME=your-domain.com
```

編輯 `nginx.conf`，取消 HTTPS 區塊的註解：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;  # 修改為您的網域

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他設定
}
```

### 3. 啟動含 Nginx 的正式環境

```bash
./docker-scripts.sh prod:nginx
```

### 4. 驗證 HTTPS

```bash
curl https://your-domain.com/health
```

---

## 部署檢查清單

部署前請確認以下項目：

- [ ] 已複製並編輯 `.env` 檔案
- [ ] 已修改所有預設密碼和密鑰
- [ ] 已設定正確的 `DOMAIN_NAME`（如使用自訂網域）
- [ ] 已準備 SSL 憑證（如使用 HTTPS）
- [ ] 已確認防火牆規則允許所需 ports
- [ ] 已確認 Docker 和 Docker Compose 版本符合需求
- [ ] 已備份重要資料
- [ ] 已測試所有服務端點

---

## 常用指令

### 查看服務狀態

```bash
./docker-scripts.sh status
```

### 查看服務日誌

```bash
# 查看所有服務日誌
./docker-scripts.sh prod:logs

# 查看特定服務
docker logs luckygo-api
docker logs luckygo-frontend
docker logs luckygo-redis
```

### 停止服務

```bash
./docker-scripts.sh prod:down
```

### 重新建置映像檔

```bash
./docker-scripts.sh build
```

### 備份 Redis 資料

```bash
./docker-scripts.sh backup
```

---

## 環境變數說明

### 必填項目

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `NODE_ENV` | 執行環境 | `production` |
| `REDIS_PASSWORD` | Redis 密碼 | `strong_password_123` |
| `SESSION_SECRET` | Session 加密密鑰 | `random_string_here` |
| `JWT_SECRET` | JWT 加密密鑰 | `another_random_string` |

### 選填項目

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `PORT` | 後端 API port | `3001` |
| `DOMAIN_NAME` | API 網域名稱 | `localhost:3001` |
| `REPOSITORY_TYPE` | 資料儲存類型 | `sqlite` |

---

## 資料持久化

專案使用 Docker volumes 保存以下資料：

- `luckygo-redis-data`: Redis 資料
- `luckygo-app-logs`: 應用程式日誌

### 備份資料

```bash
# 備份 Redis
docker run --rm \
  -v luckygo-redis-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/redis-$(date +%Y%m%d).tar.gz -C /data .

# 備份日誌
docker run --rm \
  -v luckygo-app-logs:/logs \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/logs-$(date +%Y%m%d).tar.gz -C /logs .
```

### 還原資料

```bash
# 還原 Redis
docker run --rm \
  -v luckygo-redis-data:/data \
  -v $(pwd)/backup:/backup \
  alpine sh -c "cd /data && tar xzf /backup/redis-YYYYMMDD.tar.gz"
```

---

## 效能調校

### Redis 設定

編輯 `docker-compose.yml` 中的 Redis 指令：

```yaml
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Nginx 設定

調整 `nginx.conf` 中的 rate limiting：

```nginx
# API 請求限制（每秒 10 個請求）
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# 一般網頁請求限制（每秒 30 個請求）
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;
```

---

## 監控與維護

### 健康檢查

```bash
# 後端 API 健康檢查
curl http://localhost:3001/health

# 檢查 Redis 連線
docker exec luckygo-redis redis-cli ping
```

### 日誌管理

```bash
# 清理舊日誌（保留最近 7 天）
find logs/ -name "*.log" -mtime +7 -delete
```

### 更新部署

```bash
# 1. 拉取最新程式碼
git pull

# 2. 停止現有服務
./docker-scripts.sh prod:down

# 3. 重新建置
./docker-scripts.sh build

# 4. 啟動服務
./docker-scripts.sh prod:up
```

---

## 疑難排解

### 容器無法啟動

```bash
# 檢查容器狀態
docker ps -a

# 查看特定容器日誌
docker logs luckygo-api
```

### Redis 連線失敗

```bash
# 進入 Redis 容器
docker exec -it luckygo-redis redis-cli

# 驗證密碼（如有設定）
AUTH your_redis_password
PING
```

### 前端無法連接後端

1. 檢查 `.env` 中的 `DOMAIN_NAME` 設定
2. 確認後端 API 服務正在運行
3. 檢查網路設定和防火牆規則

### Port 已被佔用

```bash
# 查看 port 使用狀況
sudo lsof -i :80
sudo lsof -i :3001

# 修改 docker-compose.yml 中的 port 映射
ports:
  - "8080:80"  # 將 80 改為 8080
```

---

## 安全性建議

1. **定期更新密碼**：至少每 90 天更新一次 Redis、JWT 和 Session 密碼
2. **使用 HTTPS**：正式環境務必啟用 SSL/TLS
3. **限制網路存取**：使用防火牆限制只開放必要的 ports
4. **定期備份**：每日備份 Redis 資料
5. **監控日誌**：定期檢查應用程式和 Nginx 日誌
6. **更新依賴套件**：定期更新 Docker images 和 npm 套件

---

## 聯絡資訊

如遇到問題，請參考：

- 專案 GitHub Issues
- 技術文件：`docs/` 目錄
- API 文件：訪問 `/api/docs`（如有啟用）

---

**最後更新日期：2025-10-22**
