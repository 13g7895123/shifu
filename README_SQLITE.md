# SQLite Repositories 使用說明

本專案現在支援兩種數據存儲方式：

## 🗃️ Repository 類型

### 1. In-Memory (內存) - 預設
- 數據存儲在應用程式內存中
- 應用程式重啟後數據會消失
- 適合開發和測試環境
- 不需要額外配置

### 2. SQLite (文件數據庫)
- 數據持久化存儲在文件中
- 應用程式重啟後數據保留
- 適合生產環境或需要數據持久化的場景
- 數據庫文件位置：`./data/luckygo.db`

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
```bash
# 複製環境變數範例文件
cp .env.example .env

# 編輯 .env 文件，設置 REPOSITORY_TYPE
# REPOSITORY_TYPE=memory   # 使用內存數據庫（預設）
# REPOSITORY_TYPE=sqlite   # 使用 SQLite 數據庫
```

### 3. 切換 Repository 類型

#### 方法一：使用 NPM 腳本
```bash
# 切換到 SQLite
npm run repo:sqlite

# 切換到內存數據庫
npm run repo:memory

# 查看當前狀態
npm run repo:status
```

#### 方法二：使用切換腳本
```bash
# 切換到 SQLite
node switch-repository.js sqlite

# 切換到內存數據庫
node switch-repository.js memory

# 查看當前狀態
node switch-repository.js status

# 查看幫助
node switch-repository.js help
```

#### 方法三：直接修改環境變數
編輯 `.env` 文件中的 `REPOSITORY_TYPE` 設定：
```bash
REPOSITORY_TYPE=sqlite  # 或 memory
```

## 🔄 啟動應用程式

```bash
# 開發模式
npm run dev

# 生產模式
npm run build
npm start
```

應用程式啟動時會自動：
1. 根據 `REPOSITORY_TYPE` 初始化對應的 repositories
2. 創建 SQLite 數據庫文件（如果使用 SQLite）
3. 初始化數據表結構
4. 創建預設數據（用戶、遊戲等）

## 🧪 測試 SQLite Repositories

運行測試腳本來驗證 SQLite repositories 是否正常工作：

```bash
npm run test:sqlite
```

這個測試會：
- 初始化 SQLite repositories
- 測試各種 CRUD 操作
- 驗證數據持久化
- 清理測試資源

## 📊 數據庫結構

SQLite 數據庫包含以下表：

### users (用戶表)
- `id` - 用戶ID (主鍵)
- `name` - 用戶名稱
- `email` - 電子郵件 (唯一)
- `password` - 密碼雜湊
- `phone` - 電話號碼
- `address` - 地址
- `point` - 願望幣
- `role` - 角色 (player/admin)
- `created_at` - 創建時間
- `updated_at` - 更新時間

### games (遊戲表)
- `id` - 遊戲ID (主鍵)
- `game_id` - 遊戲識別碼 (唯一)
- `spec` - 遊戲規格 (JSON)
- `finish_time` - 結束時間
- `canceled` - 是否取消
- `purchasing_stopped` - 是否停止購買
- `created_at` - 創建時間
- `updated_at` - 更新時間

### tickets (票券表)
- `id` - 票券ID (主鍵)
- `game_id` - 遊戲ID
- `ticket_number` - 票券號碼
- `user_id` - 用戶ID
- `purchase_price` - 購買價格
- `purchased_at` - 購買時間

### prizes (獎品表)
- `id` - 獎品ID (主鍵)
- `game_id` - 遊戲ID
- `player_id` - 玩家ID
- `ticket_number` - 票券號碼
- `prize_type` - 獎品類型 (points/physical)
- `prize_content` - 獎品內容
- `status` - 狀態 (pending_shipment/shipment_notified/shipped)
- `awarded_at` - 獲獎時間
- `created_at` - 創建時間
- `updated_at` - 更新時間

### chat_messages (聊天訊息表)
- `id` - 訊息ID (主鍵)
- `user_id` - 用戶ID
- `username` - 用戶名稱
- `message` - 訊息內容
- `timestamp` - 時間戳
- `type` - 訊息類型 (normal/system/admin)

## 🔧 開發說明

### Repository 接口
所有 repository 都實現相同的接口，確保可以無縫切換：
- `UserRepository`
- `GameRepository`
- `TicketRepository`
- `PrizeRepository`
- `ChatRepository`

### Repository Factory
`RepositoryFactory` 負責創建和管理 repository 實例：
- 單例模式確保一致性
- 支援運行時切換
- 自動處理資源清理

### 預設數據
兩種 repository 類型都會自動創建相同的預設數據：
- 預設用戶：Alice (玩家) 和 Administrator (管理員)
- 範例遊戲
- 測試獎品數據

## 📝 注意事項

1. **數據庫文件位置**：SQLite 數據庫文件保存在 `./data/luckygo.db`
2. **權限問題**：確保應用程式有讀寫 `./data/` 目錄的權限
3. **數據遷移**：切換 repository 類型不會自動遷移數據
4. **備份**：建議定期備份 SQLite 數據庫文件
5. **並發**：SQLite 支援讀並發，但寫操作是序列化的

## 🐛 故障排除

### 常見問題

1. **SQLite 初始化失敗**
   - 檢查 `./data/` 目錄權限
   - 確認 sqlite3 模組已正確安裝

2. **啟動時出現 `Exec format error`**
   - **問題描述**：日誌顯示 `SQLite 初始化失敗`，錯誤詳情包含 `Exec format error`。
   - **原因**：這通常發生在 Docker 環境中。您可能在主機（如 Windows/macOS）上安裝了 `node_modules`，然後將其掛載到 Linux 容器中，導致原生模組 `sqlite3` 的架構不相容。
   - **解決方案**：
     1. 進入正在運行的 Docker 容器：`docker exec -it <container_name> /bin/sh`
     2. 在容器內重新編譯 `sqlite3`：`npm rebuild sqlite3`
     3. 重啟應用程式。
   - **永久解決**：修改您的 `docker-compose.dev.yml`，避免將主機的 `node_modules` 目錄掛載到容器中。

2. **數據庫鎖定錯誤**
   - 確保沒有其他進程使用數據庫文件
   - 重啟應用程式

3. **環境變數不生效**
   - 檢查 `.env` 文件是否存在
   - 確認 `REPOSITORY_TYPE` 值正確
   - 重啟應用程式

### 日誌查看
應用程式會輸出詳細的初始化日誌：
```
🔧 使用 SQLITE repositories
✅ SQLite 數據庫已連接
✅ SQLite 表初始化完成
✅ SQLite repositories 初始化完成
```
