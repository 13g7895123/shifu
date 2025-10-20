# luckygo - 前後端分離架構

## 專案架構

這個專案已經重構為前後端分離的架構：

### 後端 (API Server)
- **技術棧**: Node.js + Express + TypeScript
- **端口**: 3001
- **架構**: Clean Architecture
- **功能**: 提供RESTful API

### 前端 (React App)
- **技術棧**: React + TypeScript + Material-UI
- **端口**: 3000 (開發) / 80 (生產)
- **功能**: 用戶界面和體驗

## 開發環境啟動

### 使用 Docker Compose (推薦)

1. 啟動開發環境：
```bash
docker-compose -f docker-compose.dev.yml up
```

這會同時啟動：
- 前端開發服務器 (http://localhost:3000)
- 後端API服務器 (http://localhost:3001)
- Redis數據庫

### 手動啟動

#### 後端
```bash
# 在根目錄
npm install
npm run dev
```

#### 前端
```bash
# 在 frontend 目錄
cd frontend
npm install
npm start
```

## 生產環境部署

```bash
docker-compose up
```

這會啟動：
- 前端 (Nginx + React build) - http://localhost:80
- 後端API - http://localhost:3001
- Redis數據庫

## API端點

所有API端點都以 `/api` 為前綴：

### 認證
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/me` - 獲取當前用戶信息

### 用戶管理
- `GET /api/users` - 獲取所有用戶
- `POST /api/users` - 創建用戶
- `GET /api/users/:id` - 獲取特定用戶
- `PUT /api/users/:id` - 更新用戶
- `DELETE /api/users/:id` - 刪除用戶

### 遊戲
- `GET /api/games` - 獲取所有遊戲
- (其他遊戲相關端點)

### 管理員
- `GET /api/admin/dashboard` - 管理員面板
- `GET /api/admin/users` - 管理用戶
- `GET /api/admin/games` - 管理遊戲

## 環境變數

### 後端 (.env)
```
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### 前端 (.env)
```
REACT_APP_API_URL=http://localhost:3001
```

## 主要變更

1. **移除模板引擎**: 不再使用 Handlebars，改為純API響應
2. **前端重寫**: 使用 React + Material-UI 重新建立所有頁面
3. **API化**: 所有後端端點都變成RESTful API
4. **容器化**: 前後端分別容器化
5. **代理設定**: 前端開發服務器代理API請求到後端

## 文件結構

```
luckygo/
├── src/                    # 後端代碼
│   ├── application/        # 業務邏輯層
│   ├── domain/            # 領域層
│   └── infrastructure/    # 基礎設施層
├── frontend/              # 前端代碼
│   ├── src/
│   │   ├── components/    # React組件
│   │   ├── pages/         # 頁面組件
│   │   ├── contexts/      # React Context
│   │   └── App.tsx        # 主應用組件
│   ├── public/            # 靜態資源
│   └── package.json       # 前端依賴
├── docker-compose.yml     # 生產環境配置
├── docker-compose.dev.yml # 開發環境配置
└── package.json           # 後端依賴
```
