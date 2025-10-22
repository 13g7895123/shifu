# LuckyGo 部署檢查清單

## 快速檢查

執行自動化檢查腳本：

```bash
./scripts/pre-deployment-check.sh
```

---

## 手動檢查清單

### 前置需求 ☑️

- [ ] Docker 已安裝（版本 ≥ 20.10）
- [ ] Docker Compose 已安裝（版本 ≥ 1.29）
- [ ] 可用磁碟空間 ≥ 10GB
- [ ] 可用記憶體 ≥ 2GB

### 環境設定 ☑️

- [ ] 已複製 `.env.docker` 為 `.env`
- [ ] 已修改 `REDIS_PASSWORD`（不可使用預設值）
- [ ] 已修改 `SESSION_SECRET`（建議使用隨機字串 ≥ 32 字元）
- [ ] 已修改 `JWT_SECRET`（建議使用隨機字串 ≥ 32 字元）
- [ ] 已設定 `NODE_ENV=production`

### 網路設定 ☑️

- [ ] Port 80 可用（或已調整 docker-compose.yml）
- [ ] Port 3001 可用（或已調整）
- [ ] Port 6379 可用（或已調整）
- [ ] 防火牆規則已設定（允許必要 ports）

### SSL/HTTPS（選用）☑️

僅在使用 HTTPS 時需要：

- [ ] 已建立 `ssl/` 目錄
- [ ] 已放入 `ssl/cert.pem`（SSL 憑證）
- [ ] 已放入 `ssl/key.pem`（私鑰）
- [ ] 已修改 `nginx.conf` 中的 `server_name`
- [ ] 已設定 `.env` 中的 `DOMAIN_NAME`
- [ ] 已取消 `nginx.conf` 中 HTTPS server 區塊的註解

### 語法驗證 ☑️

- [ ] Shell scripts 語法正確
  ```bash
  bash -n docker-scripts.sh
  bash -n setup.sh
  bash -n frontend/entrypoint.sh
  ```

- [ ] Docker Compose 配置正確
  ```bash
  docker compose -f docker-compose.yml config > /dev/null
  ```

### 版本控制 ☑️

- [ ] 所有變更已提交至 Git
- [ ] 已標記版本 tag（可選）
- [ ] 已推送至遠端倉庫（如需）

### 備份準備 ☑️

- [ ] 已備份現有的 Redis 資料（如有）
- [ ] 已備份現有的應用程式日誌（如有）
- [ ] 已記錄當前運行的版本號

---

## 部署步驟

### 標準部署（HTTP）

```bash
# 1. 建置 Docker images
./docker-scripts.sh build

# 2. 啟動服務
./docker-scripts.sh prod:up

# 3. 驗證服務
./docker-scripts.sh status

# 4. 檢查健康狀態
curl http://localhost:3001/health
curl http://localhost
```

### HTTPS 部署

```bash
# 1. 建置 Docker images
./docker-scripts.sh build

# 2. 啟動含 Nginx 的服務
./docker-scripts.sh prod:nginx

# 3. 驗證服務
./docker-scripts.sh status

# 4. 檢查健康狀態
curl https://your-domain.com/health
```

---

## 部署後驗證 ☑️

### 基本功能測試

- [ ] 前端可正常訪問
- [ ] 後端 API 健康檢查通過
- [ ] Redis 連線正常
- [ ] WebSocket 連線正常（如使用）

### 測試指令

```bash
# 前端測試
curl -I http://localhost

# API 健康檢查
curl http://localhost:3001/health

# Redis 測試
docker exec luckygo-redis redis-cli ping

# 查看服務日誌
./docker-scripts.sh prod:logs
```

### 負載測試（可選）

```bash
# 使用 Apache Bench 測試（需安裝 ab）
ab -n 1000 -c 10 http://localhost/

# 使用 curl 測試 API
for i in {1..100}; do
  curl -s http://localhost:3001/health > /dev/null && echo "Request $i: OK"
done
```

---

## 回滾計畫 ☑️

如果部署失敗，執行以下步驟：

```bash
# 1. 停止新版本
./docker-scripts.sh prod:down

# 2. 切換到舊版本
git checkout <previous-version-tag>

# 3. 還原資料（如有備份）
docker run --rm \
  -v luckygo-redis-data:/data \
  -v $(pwd)/backup:/backup \
  alpine sh -c "cd /data && tar xzf /backup/redis-YYYYMMDD.tar.gz"

# 4. 重新啟動
./docker-scripts.sh prod:up
```

---

## 監控項目 ☑️

部署後應持續監控：

- [ ] 容器狀態（docker ps）
- [ ] 應用程式日誌（docker logs）
- [ ] 系統資源使用率（CPU、記憶體、磁碟）
- [ ] API 回應時間
- [ ] 錯誤率
- [ ] Redis 記憶體使用量

### 監控指令

```bash
# 查看容器狀態
docker ps

# 查看資源使用
docker stats

# 查看日誌（最近 100 行）
docker logs --tail 100 luckygo-api

# 持續監控日誌
./docker-scripts.sh prod:logs
```

---

## 常見問題排查 ☑️

### 容器無法啟動

```bash
# 查看容器狀態
docker ps -a

# 查看詳細日誌
docker logs luckygo-api
docker logs luckygo-frontend
docker logs luckygo-redis
```

### Port 衝突

```bash
# 檢查 port 使用
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :6379

# 停止衝突的服務或修改 docker-compose.yml 中的 port 映射
```

### 記憶體不足

```bash
# 清理未使用的 Docker 資源
docker system prune -a

# 檢查 Docker 記憶體限制
docker stats
```

---

## 安全檢查 ☑️

### 敏感資訊

- [ ] `.env` 檔案未提交至 Git
- [ ] 所有預設密碼已更改
- [ ] SSL 私鑰權限正確設定（600）
- [ ] 資料庫連線使用強密碼

### 網路安全

- [ ] 防火牆規則已正確設定
- [ ] 僅開放必要的 ports
- [ ] Redis 不對外開放（僅內部網路）
- [ ] 已啟用 HTTPS（正式環境）

### 應用程式安全

- [ ] CORS 設定正確
- [ ] Rate limiting 已啟用
- [ ] Security headers 已設定
- [ ] 依賴套件無已知漏洞

---

## 聯絡資訊

- **技術文件**: `docs/DEPLOYMENT.md`
- **檢查腳本**: `scripts/pre-deployment-check.sh`
- **管理腳本**: `./docker-scripts.sh help`

---

**最後更新日期：2025-10-22**
