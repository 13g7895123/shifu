#!/bin/bash

# LuckyGo 生產環境部署腳本
# 基於 deploy-full.sh，針對生產環境優化
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
# 全域變數
# ========================================
ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"

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
    echo "║      LuckyGo 生產環境部署腳本 (Production)              ║"
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
# 檢查 Port 是否被佔用
# ========================================
check_port_availability() {
    local port=$1
    local service_name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $port ($service_name) 已被佔用"
        lsof -Pi :$port -sTCP:LISTEN
        echo ""
        read -p "是否要繼續部署？(y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "部署已取消"
            exit 1
        fi
    else
        log_success "Port $port ($service_name) 可用"
    fi
}

# ========================================
# 檢查並清理現有容器
# ========================================
check_and_cleanup_containers() {
    log_step "檢查現有生產環境容器..."

    # 檢查是否有運行中的生產環境容器
    RUNNING_CONTAINERS=$(docker ps --filter "name=luckygo.*prod" --format "{{.Names}}" | wc -l)
    ALL_CONTAINERS=$(docker ps -a --filter "name=luckygo.*prod" --format "{{.Names}}" | wc -l)

    if [ "$RUNNING_CONTAINERS" -gt 0 ] || [ "$ALL_CONTAINERS" -gt 0 ]; then
        log_warning "偵測到現有的 LuckyGo 生產環境容器"
        docker ps -a --filter "name=luckygo.*prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

        echo ""
        log_warning "需要停止並移除這些容器才能繼續部署"
        read -p "是否要停止並移除現有容器？(y/N) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "停止現有容器..."
            $COMPOSE_CMD -f $COMPOSE_FILE down 2>/dev/null || true

            # 確保所有生產環境容器都已停止
            docker ps -a --filter "name=luckygo.*prod" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true

            log_success "現有容器已清理"
        else
            log_error "部署已取消"
            exit 1
        fi
    else
        log_success "未發現現有生產環境容器，可以繼續部署"
    fi
}

# ========================================
# 環境變數設定
# ========================================
setup_environment() {
    log_step "設定生產環境變數..."

    # 檢查 .env.prod 檔案
    if [ ! -f $ENV_FILE ]; then
        log_error "$ENV_FILE 檔案不存在"
        log_info "請先建立生產環境配置檔案"
        log_info "參考範例：cp .env.docker .env.prod"
        exit 1
    fi
    log_success "$ENV_FILE 檔案已存在"

    # 載入環境變數
    log_info "載入生產環境變數..."
    source $ENV_FILE

    # 驗證必要的環境變數
    REQUIRED_VARS=("NODE_ENV" "BACKEND_PORT" "REDIS_PASSWORD" "JWT_SECRET" "SESSION_SECRET" "REPOSITORY_TYPE" "BACKEND_API_URL")
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

    # 生產環境安全性檢查
    log_step "執行安全性檢查..."

    local security_issues=0

    if [ "$JWT_SECRET" = "CHANGE-THIS-USE-openssl-rand-hex-32-TO-GENERATE" ]; then
        log_error "JWT_SECRET 尚未修改，請使用強隨機密鑰"
        security_issues=$((security_issues + 1))
    fi

    if [ "$SESSION_SECRET" = "CHANGE-THIS-USE-openssl-rand-hex-32-TO-GENERATE" ]; then
        log_error "SESSION_SECRET 尚未修改，請使用強隨機密鑰"
        security_issues=$((security_issues + 1))
    fi

    if [ "$REDIS_PASSWORD" = "CHANGE-THIS-TO-STRONG-PASSWORD" ]; then
        log_error "REDIS_PASSWORD 尚未修改，請設定強密碼"
        security_issues=$((security_issues + 1))
    fi

    if [ "$BACKEND_API_URL" = "http://localhost:3001" ]; then
        log_warning "BACKEND_API_URL 仍使用 localhost，生產環境請改為實際網域"
    fi

    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_warning "JWT_SECRET 長度建議至少 32 字元"
    fi

    if [ $security_issues -gt 0 ]; then
        log_error "發現 $security_issues 個安全性問題，請修正後再部署"
        exit 1
    fi

    log_success "安全性檢查通過"

    # 檢查 Port 可用性
    log_step "檢查 Port 可用性..."
    check_port_availability "${FRONTEND_PORT:-80}" "Frontend"
    check_port_availability "${BACKEND_PORT:-3001}" "Backend API"
    if [ "$REDIS_PORT" != "6379" ]; then
        check_port_availability "${REDIS_PORT}" "Redis"
    fi
}

# ========================================
# 備份現有資料
# ========================================
backup_data() {
    if [ "${AUTO_BACKUP:-true}" != "true" ]; then
        log_info "跳過自動備份（AUTO_BACKUP=false）"
        return
    fi

    log_step "備份現有資料..."

    # 建立備份目錄
    mkdir -p ${BACKUP_DIR:-./backups}
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    # 備份 SQLite 資料庫（如果存在）
    if docker volume ls | grep -q "luckygo-app-data-prod"; then
        log_info "備份 SQLite 資料庫..."
        docker run --rm \
          -v luckygo-app-data-prod:/data:ro \
          -v $(pwd)/${BACKUP_DIR}:/backup \
          alpine tar czf /backup/sqlite-$TIMESTAMP.tar.gz -C /data . \
          2>/dev/null || log_warning "SQLite 備份失敗（可能是首次部署）"
    fi

    # 備份 Redis 資料（如果存在）
    if docker volume ls | grep -q "luckygo-redis-data-prod"; then
        log_info "備份 Redis 資料..."
        docker run --rm \
          -v luckygo-redis-data-prod:/data:ro \
          -v $(pwd)/${BACKUP_DIR}:/backup \
          alpine tar czf /backup/redis-$TIMESTAMP.tar.gz -C /data . \
          2>/dev/null || log_warning "Redis 備份失敗（可能是首次部署）"
    fi

    log_success "備份完成（如有資料）"
}

# ========================================
# 建置 Docker 映像
# ========================================
build_images() {
    log_step "建置生產環境 Docker 映像..."

    log_info "開始建置映像（這可能需要幾分鐘）..."
    $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache

    log_success "Docker 映像建置完成"
}

# ========================================
# 啟動服務
# ========================================
start_services() {
    log_step "啟動生產環境服務..."

    # 檢查是否啟用 SSL
    if [ "${ENABLE_SSL:-false}" = "true" ]; then
        log_info "啟用 SSL 模式，檢查憑證..."

        if [ ! -f "${SSL_CERT_PATH}" ] || [ ! -f "${SSL_KEY_PATH}" ]; then
            log_error "SSL 憑證檔案不存在"
            log_info "CERT: ${SSL_CERT_PATH}"
            log_info "KEY: ${SSL_KEY_PATH}"
            exit 1
        fi

        log_info "啟動服務（含 Nginx HTTPS）..."
        $COMPOSE_CMD -f $COMPOSE_FILE --profile ssl up -d
        log_success "服務已啟動（SSL 模式）"
    else
        log_info "啟動服務（標準模式）..."
        $COMPOSE_CMD -f $COMPOSE_FILE up -d
        log_success "服務已啟動（標準模式）"
    fi

    # 顯示服務狀態
    echo ""
    log_info "服務狀態："
    $COMPOSE_CMD -f $COMPOSE_FILE ps
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
        if docker exec luckygo-redis-prod redis-cli -a "${REDIS_PASSWORD}" ping &> /dev/null; then
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
        if curl -s http://localhost:${BACKEND_PORT:-3001}/health &> /dev/null; then
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
        docker logs luckygo-api-prod --tail 50
        exit 1
    fi

    # 等待 Frontend
    log_info "等待 Frontend 就緒..."
    RETRY_COUNT=0
    MAX_RETRIES=30

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:${FRONTEND_PORT:-80} &> /dev/null; then
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

    sleep 3  # 等待資料庫初始化

    if docker exec luckygo-api-prod test -f /app/data/luckygo.db 2>/dev/null; then
        log_success "SQLite 資料庫檔案已建立"

        # 檢查資料表
        log_info "檢查資料表..."
        TABLES=$(docker exec luckygo-api-prod sqlite3 /app/data/luckygo.db ".tables" 2>/dev/null || echo "")

        if [ -n "$TABLES" ]; then
            log_success "資料表已建立"

            # 檢查管理員帳號
            ADMIN_COUNT=$(docker exec luckygo-api-prod sqlite3 /app/data/luckygo.db "SELECT COUNT(*) FROM users WHERE email='admin@gmail.com';" 2>/dev/null || echo "0")

            if [ "$ADMIN_COUNT" -gt 0 ]; then
                log_success "預設管理員帳號已建立 (admin@gmail.com)"
            fi
        fi
    else
        log_warning "SQLite 資料庫檔案尚未建立（可能仍在初始化中）"
    fi
}

# ========================================
# 健康檢查
# ========================================
health_check() {
    log_step "執行健康檢查..."

    # 檢查 Backend API Health
    log_info "檢查 Backend API..."
    HEALTH_RESPONSE=$(curl -s http://localhost:${BACKEND_PORT:-3001}/health)
    if [ -n "$HEALTH_RESPONSE" ]; then
        log_success "Backend API 健康檢查通過"
    else
        log_error "Backend API 健康檢查失敗"
    fi

    # 檢查 Redis
    log_info "檢查 Redis..."
    if docker exec luckygo-redis-prod redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | grep -q PONG; then
        log_success "Redis 健康檢查通過"
    else
        log_error "Redis 健康檢查失敗"
    fi

    # 檢查 Frontend
    log_info "檢查 Frontend..."
    if curl -s http://localhost:${FRONTEND_PORT:-80} &> /dev/null; then
        log_success "Frontend 健康檢查通過"
    else
        log_warning "Frontend 可能尚未完全就緒"
    fi
}

# ========================================
# 資源監控
# ========================================
monitor_resources() {
    if [ "${ENABLE_MONITORING:-false}" != "true" ]; then
        return
    fi

    log_step "資源使用狀況..."
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        $(docker ps --filter "name=luckygo.*prod" --format "{{.Names}}")
}

# ========================================
# 顯示部署資訊
# ========================================
show_deployment_info() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║          🎉 生產環境部署成功完成！                       ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}📍 服務訪問位址：${NC}"
    echo -e "  ${GREEN}➜${NC} Frontend:              http://localhost:${FRONTEND_PORT:-80}"
    echo -e "  ${GREEN}➜${NC} Backend API:           http://localhost:${BACKEND_PORT:-3001}"
    echo -e "  ${GREEN}➜${NC} Health Check:          http://localhost:${BACKEND_PORT:-3001}/health"

    if [ "${ENABLE_SSL:-false}" = "true" ]; then
        echo -e "  ${GREEN}➜${NC} HTTPS (Nginx):         https://localhost:${FRONTEND_PORT_SSL:-443}"
    fi
    echo ""

    echo -e "${CYAN}👤 預設管理員帳號：${NC}"
    echo -e "  ${GREEN}➜${NC} Email:    ${YELLOW}admin@gmail.com${NC}"
    echo -e "  ${GREEN}➜${NC} Password: ${YELLOW}admin123${NC}"
    echo ""

    echo -e "${CYAN}📂 備份位置：${NC}"
    if [ "${AUTO_BACKUP:-true}" = "true" ]; then
        echo -e "  ${GREEN}➜${NC} ${BACKUP_DIR:-./backups}"
    else
        echo -e "  ${YELLOW}➜${NC} 自動備份已停用"
    fi
    echo ""

    echo -e "${CYAN}🔧 常用指令：${NC}"
    echo -e "  ${GREEN}➜${NC} 查看服務狀態:         ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE ps${NC}"
    echo -e "  ${GREEN}➜${NC} 查看所有日誌:         ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  ${GREEN}➜${NC} 停止所有服務:         ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE down${NC}"
    echo -e "  ${GREEN}➜${NC} 重啟服務:             ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE restart${NC}"
    echo -e "  ${GREEN}➜${NC} 啟用 Debug 模式:      ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE --profile debug up -d${NC}"
    echo ""

    echo -e "${CYAN}⚠️  生產環境注意事項：${NC}"
    echo -e "  ${YELLOW}•${NC} 定期備份 SQLite 資料庫和 Redis 資料"
    echo -e "  ${YELLOW}•${NC} 定期更新密鑰（建議每 90 天）"
    echo -e "  ${YELLOW}•${NC} 監控服務資源使用狀況"
    echo -e "  ${YELLOW}•${NC} Redis port 建議不要對外開放"
    echo -e "  ${YELLOW}•${NC} 使用 Nginx 時建議啟用 HTTPS"
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
    backup_data
    build_images
    start_services
    wait_for_services
    verify_database_and_seeder
    health_check
    monitor_resources
    show_deployment_info

    log_success "生產環境部署流程全部完成！"
}

# ========================================
# 錯誤處理
# ========================================
trap 'log_error "部署過程中發生錯誤，請檢查日誌"; exit 1' ERR

# 執行主程式
main "$@"
