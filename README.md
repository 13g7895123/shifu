# luckygo - Clean Architecture Express Application

A modern web application built with Clean Architecture principles, featuring Express.js backend, Handlebars template engine, in-memory database for development, and Redis integration.

## 🏗️ Architecture

This project follows Clean Architecture principles with clear separation of concerns:

```
src/
├── domain/                 # Enterprise Business Rules
│   ├── entities/          # Domain entities
│   └── repositories/      # Repository interfaces
├── application/           # Application Business Rules
│   └── usecases/         # Use cases/interactors
└── infrastructure/       # Interface Adapters & Frameworks
    ├── repositories/     # Repository implementations
    ├── services/         # External services (Redis, etc.)
    └── web/             # Web framework (Express)
        ├── controllers/ # HTTP controllers
        ├── routes/     # Route definitions
        └── server.ts   # Server entry point
```

## 🚀 Features

- **Clean Architecture**: Domain-driven design with dependency inversion
- **Express.js**: Fast, minimalist web framework
- **Handlebars**: Logic-less template engine for server-side rendering
- **TypeScript**: Type-safe development
- **In-Memory Database**: Quick development setup (no external database required)
- **Redis Integration**: Optional caching and session storage
- **Responsive UI**: Bootstrap-powered responsive interface
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in health monitoring endpoints
- **Dynamic Domain Configuration**: Runtime API domain replacement for containerized deployments

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Handlebars, Bootstrap 5, Font Awesome
- **Database**: In-Memory (development), Redis (optional)
- **Security**: Helmet, CORS
- **Development**: ts-node-dev, ESLint, Prettier
- **Testing**: Jest

## 📦 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Redis (optional, for caching features)

## 🚀 快速開始

1. **克隆和設置專案**:
   ```bash
   git clone <repository-url>
   cd luckygo
   npm install
   ```

2. **環境設定**:
   ```bash
   copy .env.example .env
   # 編輯 .env 檔案設定您的配置
   ```

3. **啟動開發伺服器** (推薦使用 Docker):
   ```bash
   .\docker-scripts.bat dev:up
   ```

4. **開啟瀏覽器**:
   ```
   http://localhost:3000
   ```

5. **停止服務**:
   ```bash
   .\docker-scripts.bat dev:down
   ```

## 📝 可用腳本

### Docker 腳本 (推薦)
- `.\docker-scripts.bat dev:up` - 啟動開發環境
- `.\docker-scripts.bat dev:down` - 停止開發環境
- `.\docker-scripts.bat dev:logs` - 查看開發環境日誌
- `.\docker-scripts.bat prod:up` - 啟動生產環境
- `.\docker-scripts.bat prod:nginx` - 啟動生產環境 (含 Nginx)
- `.\docker-scripts.bat prod:down` - 停止生產環境
- `.\docker-scripts.bat build` - 建構 Docker 映像檔
- `.\docker-scripts.bat status` - 查看服務狀態
- `.\docker-scripts.bat clean` - 清理所有 Docker 資源
- `.\docker-scripts.bat backup` - 備份 Redis 資料

### NPM 腳本
- `npm run dev` - 啟動開發伺服器 (熱重載)
- `npm run build` - 建構 TypeScript 至 JavaScript
- `npm start` - 啟動生產伺服器
- `npm test` - 執行測試
- `npm run test:watch` - 執行測試 (監視模式)
- `npm run lint` - 檢查 TypeScript 檔案
- `npm run format` - 使用 Prettier 格式化程式碼

## 🌐 API Endpoints

### Web Pages
- `GET /` - User management dashboard
- `GET /users/create` - Create user form
- `GET /users/:id/edit` - Edit user form

### Form Actions
- `POST /users` - Create new user
- `POST /users/:id` - Update user
- `POST /users/:id/delete` - Delete user

### API Endpoints
- `GET /api/users` - Get all users (JSON)
- `GET /api/users/:id` - Get user by ID (JSON)
- `GET /health` - Health check endpoint

## 🗂️ Project Structure

```
luckygo/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── User.ts                    # User domain entity
│   │   └── repositories/
│   │       └── UserRepository.ts          # Repository interface
│   ├── application/
│   │   └── usecases/
│   │       └── UserUseCases.ts            # Business logic use cases
│   └── infrastructure/
│       ├── repositories/
│       │   └── InMemoryUserRepository.ts  # In-memory implementation
│       ├── services/
│       │   └── RedisService.ts            # Redis service
│       └── web/
│           ├── controllers/
│           │   └── UserController.ts      # HTTP controllers
│           ├── routes/
│           │   └── UserRoutes.ts          # Route definitions
│           ├── ExpressApp.ts              # Express app configuration
│           └── server.ts                  # Server entry point
├── views/
│   ├── layouts/
│   │   └── main.handlebars               # Main layout template
│   ├── index.handlebars                  # User list page
│   ├── create-user.handlebars            # Create user form
│   ├── edit-user.handlebars              # Edit user form
│   └── error.handlebars                  # Error page
├── public/                               # Static assets
├── dist/                                 # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🐳 Docker 部署

### 使用 Docker Compose 快速開始

1. **開發環境部署**:
   ```bash
   # 啟動開發環境
   .\docker-scripts.bat dev:up
   
   # 查看日誌
   .\docker-scripts.bat dev:logs
   
   # 停止服務
   .\docker-scripts.bat dev:down
   ```

2. **生產環境部署**:
   ```bash
   # 複製環境檔案
   copy .env.docker .env
   
   # 啟動所有服務
   .\docker-scripts.bat prod:up
   
   # 查看日誌
   .\docker-scripts.bat prod:logs
   ```

3. **生產環境 (含 Nginx)**:
   ```bash
   # 啟動包含反向代理的環境
   .\docker-scripts.bat prod:nginx
   ```

### 可用服務

- **luckygo App**: http://localhost:3000
- **Redis**: localhost:6379
- **Redis Commander** (開發): http://localhost:8081
- **Nginx** (生產): http://localhost:80

### Docker 命令

```bash
# 建構和啟動
.\docker-scripts.bat build
.\docker-scripts.bat dev:up

# 停止所有服務
.\docker-scripts.bat dev:down

# 查看服務狀態
.\docker-scripts.bat status

# 清理 Docker 資源
.\docker-scripts.bat clean

# 備份 Redis 資料
.\docker-scripts.bat backup
```

### Environment Files

- `.env.docker` - Docker-specific environment variables
- `.env` - Local development environment
- `.env.example` - Template for environment configuration

## 🚢 生產環境部署

### Docker 生產環境設定

1. **配置環境**:
   ```bash
   copy .env.docker .env
   # 編輯 .env 檔案設定生產環境值
   ```

2. **生成 SSL 憑證** (可選):
   ```bash
   mkdir ssl
   # 將您的 SSL 憑證放置在 ssl/ 目錄中
   ```

3. **部署和監控**:
   ```bash
   .\docker-scripts.bat prod:nginx
   ```

### 容器健康監控

所有服務都包含健康檢查:
```bash
# 檢查服務健康狀態
.\docker-scripts.bat status

# 查看健康檢查日誌
docker inspect luckygo-app --format='{{.State.Health.Status}}'
```

## �🔧 Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (optional)

### Redis Setup (Optional)

If you want to use Redis for caching or sessions:

1. **Install Redis locally**:
   ```bash
   # On macOS with Homebrew
   brew install redis
   brew services start redis
   
   # On Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   
   # On Windows
   # Download and install from https://redis.io/download
   ```

2. **Update .env file**:
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🚢 Production Deployment

### Standard Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment**:
   ```bash
   export NODE_ENV=production
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

### Docker Deployment

#### Using Docker Compose

1. **Set API domain (optional)**:
   ```bash
   # Create .env file for custom domain
   echo "DOMAIN_NAME=api.yourcompany.com:3001" > .env
   
   # Or use default localhost:3001
   ```

2. **Start services**:
   ```bash
   # Production environment
   docker-compose up -d
   
   # Development environment with hot reload
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Test domain configuration**:
   ```powershell
   # Test with custom domain
   .\test-domain-config.ps1 -DomainName "api.example.com:3001"
   
   # Test development environment
   .\test-domain-config.ps1 -DomainName "api.example.com:3001" -Dev
   
   # Rebuild frontend image
   .\test-domain-config.ps1 -Build
   ```

#### Dynamic Domain Configuration

The frontend supports runtime domain replacement using the `DOMAIN_NAME` environment variable:

- **Default**: `localhost:3001`
- **Custom**: Set `DOMAIN_NAME` environment variable when starting containers
- **Kubernetes**: Use ConfigMaps or environment variables in deployment manifests

See `frontend/DOMAIN_CONFIGURATION.md` for detailed usage instructions.

## 🤝 Clean Architecture Benefits

- **Independence**: Business rules don't depend on frameworks
- **Testability**: Easy to test business logic in isolation
- **Flexibility**: Easy to swap out infrastructure components
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to extend and modify

## 📚 Learn More

- [Clean Architecture by Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Express.js Documentation](https://expressjs.com/)
- [Handlebars.js Guide](https://handlebarsjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ using Clean Architecture principles
