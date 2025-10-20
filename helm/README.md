# luckygo Helm Chart

這是一個用於部署 luckygo 遊戲應用程式到 Kubernetes 的 Helm Chart。

## 概述

luckygo 是一個基於 Clean Architecture 的全端遊戲應用程式，包含：
- **Frontend**: React 應用程式
- **Backend**: Node.js Express API with WebSocket support
- **Redis**: 快取和會話存儲

## 特性

- ✅ 高可用性部署
- ✅ 自動擴縮容 (HPA)
- ✅ 健康檢查和存活性探針
- ✅ Ingress 支援 HTTPS
- ✅ Pod 中斷預算
- ✅ 網路策略（可選）
- ✅ 持久化存儲
- ✅ 監控支援（Prometheus 兼容）
- ✅ 多環境配置（開發/生產）

## 先決條件

- Kubernetes 1.19+
- Helm 3.2.0+
- 容器註冊表存取權限
- Ingress Controller（推薦 NGINX）

## 快速開始

### 1. 準備映像

```bash
# 構建映像
make build-images IMAGE_TAG=v1.0.0 REGISTRY=your-registry.com

# 推送映像
make push-images IMAGE_TAG=v1.0.0 REGISTRY=your-registry.com
```

### 2. 安裝依賴

```bash
# 添加 Bitnami Helm 儲存庫
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 更新 Chart 依賴
make dependency-update
```

### 3. 部署

#### 開發環境
```bash
# 檢查設定
make dry-run-dev

# 部署
make install-dev
```

#### 生產環境
```bash
# 編輯生產設定
cp helm/values-production.yaml helm/values-prod-custom.yaml
# 編輯 values-prod-custom.yaml 設定您的域名、密碼等

# 檢查設定
make dry-run-prod

# 部署
make install-prod
```

## 設定

### 重要設定項目

在 `values-production.yaml` 中設定以下項目：

```yaml
# 映像設定
global:
  imageRegistry: "your-registry.com/"

frontend:
  image:
    repository: "luckygo/frontend"
    tag: "1.0.0"

backend:
  image:
    repository: "luckygo/backend"
    tag: "1.0.0"

# 域名設定
ingress:
  hosts:
    - host: your.domain

# 安全設定
secrets:
  jwtSecret: "your-secure-jwt-secret"
  redisPassword: "your-secure-redis-password"
```

### 環境變數

Chart 會自動設定以下環境變數：
- `NODE_ENV`: 根據環境設定
- `REDIS_URL`: Redis 連接字串
- `FRONTEND_URL`: 前端 URL
- `REACT_APP_API_URL`: API URL

## 常用命令

### 部署管理
```bash
# 查看狀態
make status

# 升級
make upgrade-prod

# 回滾
make rollback

# 卸載
make uninstall
```

### 監控和除錯
```bash
# 查看 Pod
make get-pods

# 查看日誌
make logs-frontend
make logs-backend

# 連接埠轉發
make port-forward-frontend  # 前端: http://localhost:8080
make port-forward-backend   # 後端: http://localhost:3001

# 進入 Pod
make shell-backend
```

### 擴縮容
```bash
# 手動擴縮容
make scale-frontend REPLICAS=5
make scale-backend REPLICAS=3
```

## 監控

### 健康檢查端點

- Frontend: `GET /`
- Backend: `GET /health`

### Prometheus 指標

如果啟用監控，指標將在以下端點可用：
- Backend: `GET /metrics`

## 安全性

### 預設安全措施

1. **非 root 用戶執行**
2. **只讀根檔案系統**（部分）
3. **去除所有 capabilities**
4. **Pod Security Context**
5. **網路策略**（可選）

### 生產環境檢查清單

- [ ] 更改所有預設密碼
- [ ] 設定 HTTPS/TLS
- [ ] 設定映像拉取密鑰
- [ ] 啟用網路策略
- [ ] 設定資源限制
- [ ] 設定備份策略
- [ ] 配置監控告警

## 故障排除

### 常見問題

1. **Pod 啟動失敗**
   ```bash
   make describe-pods
   make logs-backend
   ```

2. **映像拉取失敗**
   - 檢查映像名稱和標籤
   - 確認 imagePullSecrets

3. **服務無法連接**
   ```bash
   make get-services
   make port-forward-backend
   ```

4. **Ingress 問題**
   ```bash
   make get-ingress
   kubectl describe ingress -n luckygo
   ```

### 除錯模式

```bash
# 生成 YAML 檢查
make template-prod > debug.yaml

# 檢查事件
kubectl get events -n luckygo --sort-by='.lastTimestamp'
```

## 升級

### 版本升級
```bash
# 更新映像版本
helm upgrade luckygo ./helm/luckygo -n luckygo \
  --set backend.image.tag=v1.1.0 \
  --set frontend.image.tag=v1.1.0
```

### Chart 升級
```bash
# 使用新的 values 檔案
make upgrade-prod
```

## 備份和恢復

### Redis 資料
```bash
# 備份
kubectl exec -n luckygo deployment/luckygo-redis-master -- redis-cli BGSAVE

# 恢復（請參考 Redis 文檔）
```

### 持久化卷
- 使用雲端供應商的快照功能
- 或使用 Velero 等備份工具

## 開發

### 本地開發環境

```bash
# 部署開發環境
make install-dev

# 連接埠轉發進行開發
make port-forward-frontend
make port-forward-backend
```

### Chart 開發

```bash
# 檢查語法
make lint

# 生成模板
make template

# 打包
make package
```

## 支援

- 查看 [部署指南](./DEPLOYMENT_GUIDE.md) 獲取詳細說明
- 檢查 Kubernetes 事件和日誌
- 參考 [Helm 文檔](https://helm.sh/docs/)

## 授權

MIT License
