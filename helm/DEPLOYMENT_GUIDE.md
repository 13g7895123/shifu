# luckygo Helm Chart 部署指南

這個 Helm Chart 用於將 luckygo 遊戲應用程式部署到 Kubernetes 集群。

## 先決條件

1. **Kubernetes 集群**: 版本 1.19+
2. **Helm**: 版本 3.2.0+
3. **容器映像**: 確保已構建並推送到容器註冊表
4. **Ingress Controller**: 如 NGINX Ingress Controller（如果啟用 Ingress）
5. **存儲類**: 用於持久化存儲（可選）

## 快速開始

### 1. 構建和推送容器映像

```bash
# 構建前端映像
cd frontend
docker build -t your-registry/luckygo/frontend:latest .
docker push your-registry/luckygo/frontend:latest

# 構建後端映像
cd ..
docker build -t your-registry/luckygo/backend:latest .
docker push your-registry/luckygo/backend:latest
```

### 2. 安裝 Redis 依賴

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### 3. 創建 namespace

```bash
kubectl create namespace luckygo
```

### 4. 安裝 Chart

```bash
# 使用預設值安裝
helm install luckygo ./helm/luckygo -n luckygo

# 或使用自訂值檔案
helm install luckygo ./helm/luckygo -n luckygo -f values-production.yaml
```

## 設定選項

### 基本設定

創建一個 `values-production.yaml` 檔案：

```yaml
# 映像設定
global:
  imageRegistry: "your-registry.com/"

frontend:
  image:
    repository: "luckygo/frontend"
    tag: "v1.0.0"
    
backend:
  image:
    repository: "luckygo/backend"
    tag: "v1.0.0"

# Ingress 設定
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: your.domain
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
        - path: /socket.io
          pathType: Prefix
          service: backend
  tls:
    - secretName: luckygo-tls
      hosts:
        - your.domain

# Redis 設定
redis:
  auth:
    password: "your-secure-redis-password"

# 安全設定
secrets:
  jwtSecret: "your-jwt-secret-key"
  redisPassword: "your-secure-redis-password"
```

### 高可用性設定

```yaml
# 副本數設定
frontend:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

backend:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

# Redis 叢集設定
redis:
  replica:
    replicaCount: 2
  master:
    persistence:
      enabled: true
      size: 8Gi

# Pod 中斷預算
podDisruptionBudget:
  enabled: true
  minAvailable: 2
```

### 資源限制

```yaml
frontend:
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi

backend:
  resources:
    limits:
      cpu: 2000m
      memory: 2Gi
    requests:
      cpu: 1000m
      memory: 1Gi
```

## 部署命令

### 安裝

```bash
# 乾式運行檢查
helm install --dry-run --debug luckygo ./helm/luckygo -n luckygo

# 實際安裝
helm install luckygo ./helm/luckygo -n luckygo -f values-production.yaml
```

### 升級

```bash
# 升級應用程式
helm upgrade luckygo ./helm/luckygo -n luckygo -f values-production.yaml

# 升級特定映像版本
helm upgrade luckygo ./helm/luckygo -n luckygo \
  --set backend.image.tag=v1.1.0 \
  --set frontend.image.tag=v1.1.0
```

### 回滾

```bash
# 查看發布歷史
helm history luckygo -n luckygo

# 回滾到前一版本
helm rollback luckygo -n luckygo

# 回滾到特定版本
helm rollback luckygo 1 -n luckygo
```

### 卸載

```bash
helm uninstall luckygo -n luckygo
```

## 監控和維護

### 檢查部署狀態

```bash
# 檢查 Pod 狀態
kubectl get pods -n luckygo

# 檢查服務
kubectl get svc -n luckygo

# 檢查 Ingress
kubectl get ingress -n luckygo
```

### 查看日誌

```bash
# 前端日誌
kubectl logs -n luckygo -l app.kubernetes.io/component=frontend -f

# 後端日誌
kubectl logs -n luckygo -l app.kubernetes.io/component=backend -f

# Redis 日誌
kubectl logs -n luckygo -l app.kubernetes.io/name=redis -f
```

### 執行測試

```bash
# 執行連接測試
helm test luckygo -n luckygo
```

### 擴縮容

```bash
# 手動擴縮容
kubectl scale deployment luckygo-frontend -n luckygo --replicas=5
kubectl scale deployment luckygo-backend -n luckygo --replicas=5

# 透過 Helm 更新
helm upgrade luckygo ./helm/luckygo -n luckygo \
  --set frontend.replicaCount=5 \
  --set backend.replicaCount=5
```

## 故障排除

### 常見問題

1. **Pod 無法啟動**
   ```bash
   kubectl describe pod <pod-name> -n luckygo
   kubectl logs <pod-name> -n luckygo
   ```

2. **映像拉取失敗**
   - 檢查映像名稱和標籤
   - 確認 imagePullSecrets 設定正確

3. **服務無法連接**
   ```bash
   kubectl get endpoints -n luckygo
   kubectl port-forward svc/luckygo-frontend 8080:80 -n luckygo
   ```

4. **Ingress 無法訪問**
   - 檢查 Ingress Controller 是否運行
   - 確認 DNS 設定正確

### 除錯模式

```bash
# 在 Pod 中執行除錯命令
kubectl exec -it <pod-name> -n luckygo -- /bin/bash

# 檢查服務發現
kubectl exec -it <pod-name> -n luckygo -- nslookup luckygo-backend
```

## 安全性考慮

1. **更新預設密碼**：務必更改所有預設密碼
2. **使用 TLS**：在生產環境中啟用 HTTPS
3. **網路策略**：啟用網路策略限制 Pod 間通信
4. **映像安全**：定期更新基礎映像
5. **RBAC**：設定適當的角色和權限

## 備份和恢復

### Redis 資料備份

```bash
# 創建 Redis 資料備份
kubectl exec -n luckygo <redis-pod> -- redis-cli BGSAVE

# 複製備份檔案
kubectl cp luckygo/<redis-pod>:/data/dump.rdb ./backup/
```

### 持久化卷備份

使用您的雲端提供商的快照功能或備份工具。

## 效能調整

### 資源監控

```bash
# 查看資源使用情況
kubectl top pods -n luckygo
kubectl top nodes
```

### 自動擴縮容調整

根據監控指標調整 HPA 設定：

```yaml
frontend:
  autoscaling:
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
```

## 支援

如果遇到問題，請檢查：
1. Kubernetes 事件：`kubectl get events -n luckygo`
2. Pod 狀態：`kubectl describe pods -n luckygo`
3. 服務日誌：`kubectl logs -n luckygo <pod-name>`

更多幫助請參考 [Kubernetes 文檔](https://kubernetes.io/docs/) 和 [Helm 文檔](https://helm.sh/docs/)。
