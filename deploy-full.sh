#!/bin/bash

# LuckyGo 完整部署腳本
# 功能：檢查容器、清理、部署、初始化資料庫、執行 seeder、驗證服務
# Author: Auto-generated
# Date: 2025-10-25

set -e

# ========================================
# 顏色定義
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ========================================
# 輔助函數
# ========================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

print_banner() {
    echo -e "${MAGENTA}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║        LuckyGo 完整部署腳本 (Docker Compose)             ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ========================================
# 前置檢查
# ========================================
check_dependencies() {
    log_step "檢查系統依賴..."

    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    log_success "Docker 已安裝"

    # 檢查 Docker Compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        log_success "使用 Docker Compose V2 (plugin)"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        log_warning "使用舊版 docker-compose，建議升級到 Docker Compose V2"
    else
        log_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi

    # 檢查 Docker 服務狀態
    if ! docker info &> /dev/null; then
        log_error "Docker 服務未運行，請啟動 Docker"
        exit 1
    fi
    log_success "Docker 服務運行中"
}

# ========================================
# 檢查並清理現有容器
# ========================================
check_and_cleanup_containers() {
    log_step "檢查現有容器..."

    # 檢查是否有運行中的容器
    RUNNING_CONTAINERS=$(docker ps --filter "name=luckygo" --format "{{.Names}}" | wc -l)
    ALL_CONTAINERS=$(docker ps -a --filter "name=luckygo" --format "{{.Names}}" | wc -l)

    if [ "$RUNNING_CONTAINERS" -gt 0 ] || [ "$ALL_CONTAINERS" -gt 0 ]; then
        log_warning "偵測到現有的 LuckyGo 容器"
        docker ps -a --filter "name=luckygo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

        echo ""
        log_warning "需要停止並移除這些容器才能繼續部署"
        read -p "是否要停止並移除現有容器？(y/N) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "停止現有容器..."
            $COMPOSE_CMD down 2>/dev/null || true

            # 確保所有 luckygo 容器都已停止
            docker ps -a --filter "name=luckygo" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true

            log_success "現有容器已清理"
        else
            log_error "部署已取消"
            exit 1
        fi
    else
        log_success "未發現現有容器，可以繼續部署"
    fi
}

# ========================================
# 環境變數設定
# ========================================
setup_environment() {
    log_step "設定環境變數..."

    # 檢查 .env 檔案
    if [ ! -f .env ]; then
        log_warning ".env 檔案不存在，從 .env.docker 複製..."
        if [ -f .env.docker ]; then
            cp .env.docker .env
            log_success ".env 檔案已建立"
        else
            log_error ".env.docker 範本檔案不存在"
            exit 1
        fi
    else
        log_success ".env 檔案已存在"
    fi

    # 驗證必要的環境變數
    log_info "驗證環境變數..."
    source .env

    REQUIRED_VARS=("NODE_ENV" "PORT" "REDIS_PASSWORD" "JWT_SECRET" "SESSION_SECRET" "REPOSITORY_TYPE")
    MISSING_VARS=()

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        log_error "缺少必要的環境變數："
        printf '%s\n' "${MISSING_VARS[@]}"
        exit 1
    fi

    log_success "環境變數驗證完成"

    # 安全性檢查
    if [ "$JWT_SECRET" = "your_jwt_secret_here_change_in_production" ]; then
        log_warning "JWT_SECRET 使用預設值，建議修改為更安全的密鑰"
    fi

    if [ "$SESSION_SECRET" = "your_session_secret_here_change_in_production" ]; then
        log_warning "SESSION_SECRET 使用預設值，建議修改為更安全的密鑰"
    fi
}

# ========================================
# 建置 Docker 映像
# ========================================
build_images() {
    log_step "建置 Docker 映像..."

    log_info "開始建置映像（這可能需要幾分鐘）..."
    $COMPOSE_CMD build --no-cache

    log_success "Docker 映像建置完成"
}

# ========================================
# 啟動服務
# ========================================
start_services() {
    log_step "啟動 Docker Compose 服務..."

    log_info "啟動所有服務（Frontend、Backend、Redis、Redis Commander）..."
    $COMPOSE_CMD up -d

    log_success "所有服務已啟動"

    # 顯示服務狀態
    echo ""
    log_info "服務狀態："
    $COMPOSE_CMD ps
}

# ========================================
# 等待服務就緒
# ========================================
wait_for_services() {
    log_step "等待服務就緒..."

    # 等待 Redis
    log_info "等待 Redis 就緒..."
    RETRY_COUNT=0
    MAX_RETRIES=30

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker exec luckygo-redis redis-cli ping &> /dev/null; then
            log_success "Redis 已就緒"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 1
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        log_error "Redis 啟動超時"
        exit 1
    fi

    # 等待 Backend API
    log_info "等待 Backend API 就緒..."
    RETRY_COUNT=0
    MAX_RETRIES=60

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:3001/health &> /dev/null; then
            log_success "Backend API 已就緒"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        log_error "Backend API 啟動超時"
        log_info "查看日誌："
        docker logs luckygo-api --tail 50
        exit 1
    fi

    # 等待 Frontend
    log_info "等待 Frontend 就緒..."
    RETRY_COUNT=0
    MAX_RETRIES=30

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:80 &> /dev/null; then
            log_success "Frontend 已就緒"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        log_warning "Frontend 啟動超時（但可能仍在編譯中）"
    fi
}

# ========================================
# 驗證資料庫與 Seeder
# ========================================
verify_database_and_seeder() {
    log_step "驗證資料庫與 Seeder..."

    log_info "資料庫初始化說明："
    echo "  - SQLite 資料表會在 Backend 啟動時自動建立"
    echo "  - 位置：SqliteService.ts 的 initializeTables() 方法"
    echo "  - 資料表：users, games, tickets, prizes, chat_messages"

    log_info "Seeder 執行說明："
    echo "  - 預設管理員帳號會在 UserRepository 初始化時自動建立"
    echo "  - 位置：SqliteUserRepository.ts 的 initializeDefaultUsers() 方法"

    # 檢查資料庫檔案
    sleep 3  # 等待資料庫初始化

    if docker exec luckygo-api test -f /app/data/luckygo.db 2>/dev/null; then
        log_success "SQLite 資料庫檔案已建立"

        # 檢查資料表
        log_info "檢查資料表..."
        TABLES=$(docker exec luckygo-api sqlite3 /app/data/luckygo.db ".tables" 2>/dev/null || echo "")

        if [ -n "$TABLES" ]; then
            log_success "資料表已建立："
            echo "$TABLES" | tr ' ' '\n' | sed 's/^/  - /'

            # 檢查管理員帳號
            log_info "檢查預設管理員帳號..."
            ADMIN_COUNT=$(docker exec luckygo-api sqlite3 /app/data/luckygo.db "SELECT COUNT(*) FROM users WHERE email='admin@gmail.com';" 2>/dev/null || echo "0")

            if [ "$ADMIN_COUNT" -gt 0 ]; then
                log_success "預設管理員帳號已建立 (admin@gmail.com)"
            else
                log_warning "預設管理員帳號尚未建立（可能仍在初始化中）"
                log_info "可以查看 Backend 日誌確認："
                echo "  docker logs luckygo-api | grep -i 'default\|admin\|seeder'"
            fi
        else
            log_warning "資料表可能尚未建立完成"
        fi
    else
        log_warning "SQLite 資料庫檔案尚未建立（可能仍在初始化中）"
        log_info "查看 Backend 日誌："
        docker logs luckygo-api --tail 30
    fi
}

# ========================================
# 健康檢查
# ========================================
health_check() {
    log_step "執行健康檢查..."

    # 檢查 Backend API Health
    log_info "檢查 Backend API..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
    if [ -n "$HEALTH_RESPONSE" ]; then
        log_success "Backend API 健康檢查通過"
        echo "  回應：$HEALTH_RESPONSE"
    else
        log_error "Backend API 健康檢查失敗"
    fi

    # 檢查 Redis
    log_info "檢查 Redis..."
    if docker exec luckygo-redis redis-cli ping | grep -q PONG; then
        log_success "Redis 健康檢查通過"
    else
        log_error "Redis 健康檢查失敗"
    fi

    # 檢查 Frontend
    log_info "檢查 Frontend..."
    if curl -s http://localhost:80 &> /dev/null; then
        log_success "Frontend 健康檢查通過"
    else
        log_warning "Frontend 可能尚未完全就緒"
    fi
}

# ========================================
# 顯示部署資訊
# ========================================
show_deployment_info() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║              🎉 部署成功完成！                            ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}📍 服務訪問位址：${NC}"
    echo -e "  ${GREEN}➜${NC} Frontend (前端):       http://localhost:80"
    echo -e "  ${GREEN}➜${NC} Backend API (後端):    http://localhost:3001"
    echo -e "  ${GREEN}➜${NC} Health Check:          http://localhost:3001/health"
    echo -e "  ${GREEN}➜${NC} Redis:                 localhost:6379"
    echo -e "  ${GREEN}➜${NC} Redis Commander (UI):  http://localhost:8081"
    echo ""

    echo -e "${CYAN}👤 預設管理員帳號：${NC}"
    echo -e "  ${GREEN}➜${NC} Email:    ${YELLOW}admin@gmail.com${NC}"
    echo -e "  ${GREEN}➜${NC} Password: ${YELLOW}admin123${NC}"
    echo -e "  ${GREEN}➜${NC} Role:     ${YELLOW}ADMIN${NC}"
    echo -e "  ${GREEN}➜${NC} Points:   ${YELLOW}500${NC}"
    echo ""

    echo -e "${CYAN}🗄️  資料庫資訊：${NC}"
    echo -e "  ${GREEN}➜${NC} Type:     SQLite"
    echo -e "  ${GREEN}➜${NC} Location: /app/data/luckygo.db (容器內)"
    echo -e "  ${GREEN}➜${NC} Tables:   users, games, tickets, prizes, chat_messages"
    echo ""

    echo -e "${CYAN}🔧 常用指令：${NC}"
    echo -e "  ${GREEN}➜${NC} 查看服務狀態:         ${YELLOW}$COMPOSE_CMD ps${NC}"
    echo -e "  ${GREEN}➜${NC} 查看所有日誌:         ${YELLOW}$COMPOSE_CMD logs -f${NC}"
    echo -e "  ${GREEN}➜${NC} 查看 Backend 日誌:    ${YELLOW}docker logs -f luckygo-api${NC}"
    echo -e "  ${GREEN}➜${NC} 查看 Frontend 日誌:   ${YELLOW}docker logs -f luckygo-frontend${NC}"
    echo -e "  ${GREEN}➜${NC} 停止所有服務:         ${YELLOW}$COMPOSE_CMD down${NC}"
    echo -e "  ${GREEN}➜${NC} 重啟服務:             ${YELLOW}$COMPOSE_CMD restart${NC}"
    echo ""

    echo -e "${CYAN}📊 測試建議：${NC}"
    echo -e "  1. 訪問前端: ${YELLOW}http://localhost:80${NC}"
    echo -e "  2. 使用管理員帳號登入: ${YELLOW}admin@gmail.com / admin123${NC}"
    echo -e "  3. 檢查 API 健康狀態: ${YELLOW}curl http://localhost:3001/health${NC}"
    echo -e "  4. 訪問 Redis UI: ${YELLOW}http://localhost:8081${NC}"
    echo ""

    echo -e "${CYAN}⚠️  注意事項：${NC}"
    echo -e "  ${YELLOW}•${NC} 請修改 .env 中的預設密鑰（JWT_SECRET, SESSION_SECRET, REDIS_PASSWORD）"
    echo -e "  ${YELLOW}•${NC} 生產環境請設定 NODE_ENV=production"
    echo -e "  ${YELLOW}•${NC} 定期備份 Redis 資料和 SQLite 資料庫"
    echo ""
}

# ========================================
# 主要執行流程
# ========================================
main() {
    print_banner

    # 執行各階段
    check_dependencies
    check_and_cleanup_containers
    setup_environment
    build_images
    start_services
    wait_for_services
    verify_database_and_seeder
    health_check
    show_deployment_info

    log_success "部署流程全部完成！"
}

# ========================================
# 錯誤處理
# ========================================
trap 'log_error "部署過程中發生錯誤，請檢查日誌"; exit 1' ERR

# 執行主程式
main "$@"
