# Docker Compose V2 語法遷移說明

## 概述

本專案已全面更新為 Docker Compose V2 的新語法，從舊的 `docker-compose`（連字符）改為新的 `docker compose`（空格）。

**更新日期**: 2025-10-22

---

## 語法變更對比

### 舊語法 (Docker Compose V1)
```bash
docker-compose up -d
docker-compose down
docker-compose ps
docker-compose logs -f
```

### 新語法 (Docker Compose V2)
```bash
docker compose up -d
docker compose down
docker compose ps
docker compose logs -f
```

**主要差異**: 將命令中的連字符 `-` 改為空格

---

## 已更新的文件

### 1. **docker-scripts.sh** ✅
主要的 Docker 管理腳本，所有 `docker-compose` 命令已更新為 `docker compose`。

**變更內容**:
- 更新依賴檢查函數，優先使用新版 `docker compose`
- 若檢測到使用舊版會顯示警告訊息
- 所有函數中的命令已更新：
  - `dev_up()`, `dev_down()`, `dev_logs()`
  - `prod_up()`, `prod_up_nginx()`, `prod_down()`, `prod_logs()`
  - `build()`, `clean()`, `status()`, `backup_redis()`

**執行範例**:
```bash
./docker-scripts.sh prod:up
# 輸出: [INFO] Using Docker Compose plugin (docker compose)
```

### 2. **setup.sh** ✅
快速設定腳本，用於初始化開發環境。

**變更內容**:
- 更新依賴檢查，同時支援新舊兩種語法
- 啟動命令更新為 `docker compose -f docker-compose.dev.yml up -d`
- 停止服務提示訊息也已更新

### 3. **package.json** ✅
NPM scripts 中的 Docker 相關命令。

**變更內容**:
```json
{
  "scripts": {
    "docker:dev": "docker compose -f docker-compose.dev.yml up -d",
    "docker:dev:down": "docker compose -f docker-compose.dev.yml down",
    "docker:prod": "docker compose up -d",
    "docker:prod:down": "docker compose down",
    "docker:build": "docker compose build",
    "docker:logs": "docker compose logs -f"
  }
}
```

### 4. **scripts/pre-deployment-check.sh** ✅
部署前檢查腳本（已支援雙語法）。

**變更內容**:
- `check_docker_compose()` 函數已優先檢查新版
- `check_docker_compose_syntax()` 同時嘗試新舊兩種語法
- 確保向後兼容性

### 5. **docs/DEPLOYMENT.md** ✅
部署文檔已更新系統需求說明。

**變更內容**:
- 明確說明推薦使用 Docker Compose V2
- 註明仍支援舊版語法

---

## 向後兼容性

### ✅ 兼容舊版 Docker Compose

所有腳本都設計為同時支援新舊兩種語法：

1. **優先使用新版**: 腳本會先嘗試 `docker compose`
2. **回退到舊版**: 如果新版不可用，會使用 `docker-compose`
3. **顯示警告**: 使用舊版時會提示用戶升級

**範例（docker-scripts.sh）**:
```bash
# 檢查新版 docker compose (plugin) 或舊版 docker-compose
if docker compose version &> /dev/null; then
    log_info "Using Docker Compose plugin (docker compose)"
elif command -v docker-compose &> /dev/null; then
    log_warning "Using legacy docker-compose. Consider upgrading to Docker Compose V2 plugin."
else
    log_error "Docker Compose is not installed."
    exit 1
fi
```

---

## 如何安裝 Docker Compose V2

### Linux

```bash
# Docker Compose V2 通常作為 Docker CLI 的 plugin 安裝
# 如果您使用 Docker Desktop，已經內建了

# 手動安裝（Ubuntu/Debian）
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 驗證安裝
docker compose version
```

### macOS

```bash
# 使用 Docker Desktop（推薦）
# Docker Desktop for Mac 已內建 Docker Compose V2

# 或使用 Homebrew
brew install docker-compose

# 驗證安裝
docker compose version
```

### Windows

```powershell
# 使用 Docker Desktop（推薦）
# Docker Desktop for Windows 已內建 Docker Compose V2

# 驗證安裝
docker compose version
```

---

## 遷移檢查清單

如果您之前使用舊版 docker-compose，請進行以下檢查：

### 1. 檢查 Docker Compose 版本

```bash
# 檢查新版
docker compose version

# 檢查舊版
docker-compose version
```

### 2. 測試腳本

```bash
# 測試管理腳本
./docker-scripts.sh help

# 測試設定腳本
./setup.sh --help 2>&1 || echo "設定腳本可正常執行"

# 測試 NPM scripts
npm run docker:build
```

### 3. 執行部署前檢查

```bash
./scripts/pre-deployment-check.sh
```

應該看到類似以下輸出：
```
✅ PASS Docker 已安裝 (版本: 28.5.0)
✅ PASS Docker daemon 正在運行
✅ PASS Docker Compose 已安裝 (版本: 2.x.x)
[INFO] Using Docker Compose plugin (docker compose)
```

---

## 常見問題 (FAQ)

### Q1: 我還在使用舊版 docker-compose，會有問題嗎？

**A**: 不會！所有腳本都向後兼容。但建議升級到 Docker Compose V2 以獲得：
- 更好的效能
- 更多新功能
- 持續的安全更新
- 官方長期支援

### Q2: 如何卸載舊版 docker-compose？

**A**: 確認新版正常運作後，可以卸載舊版：

```bash
# 檢查舊版安裝位置
which docker-compose

# 刪除舊版（通常在 /usr/local/bin/）
sudo rm /usr/local/bin/docker-compose

# 或如果是透過 pip 安裝
pip uninstall docker-compose
```

### Q3: 新舊版本有功能差異嗎？

**A**: Docker Compose V2 是 V1 的完全重寫版本（使用 Go 語言），但保持了命令兼容性。主要差異：
- V2 效能更好
- V2 與 Docker CLI 更緊密整合
- V2 支援更多新功能（如 profiles、depends_on 增強等）

### Q4: CI/CD 環境需要更新嗎？

**A**: 建議更新，但不強制。如果您的 CI/CD 環境使用舊版，腳本仍能正常運作。更新步驟：

```yaml
# GitHub Actions 範例
- name: Install Docker Compose V2
  run: |
    sudo apt-get update
    sudo apt-get install docker-compose-plugin
```

### Q5: 可以在同一系統上同時使用新舊版本嗎？

**A**: 可以！兩者可以共存：
- `docker compose` - 新版（plugin）
- `docker-compose` - 舊版（standalone）

但建議統一使用新版以避免混淆。

---

## 驗證更新

執行以下命令驗證所有更新是否成功：

```bash
# 1. 檢查語法
bash -n docker-scripts.sh
bash -n setup.sh

# 2. 驗證 JSON
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"

# 3. 測試 Docker Compose 配置
docker compose -f docker-compose.yml config > /dev/null

# 4. 執行部署前檢查
./scripts/pre-deployment-check.sh

# 5. 測試腳本功能
./docker-scripts.sh status
```

---

## 相關資源

- [Docker Compose V2 官方文檔](https://docs.docker.com/compose/cli-command/)
- [從 V1 遷移到 V2](https://docs.docker.com/compose/migrate/)
- [Docker Compose 發行說明](https://github.com/docker/compose/releases)

---

## 總結

✅ 所有腳本已更新為 Docker Compose V2 語法
✅ 完全向後兼容舊版 docker-compose
✅ 所有語法已驗證通過
✅ 部署文檔已同步更新

**建議**: 盡快升級到 Docker Compose V2 以獲得最佳體驗和持續支援。

---

**最後更新**: 2025-10-22
**維護者**: LuckyGo Development Team
