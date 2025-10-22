#!/bin/bash

# luckygo 部署前檢查腳本
# 用途：驗證所有部署前置條件是否滿足

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
log_pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARN${NC} $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
}

# Check functions
check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_pass "Docker 已安裝 (版本: $DOCKER_VERSION)"

        # Check if Docker daemon is running
        if docker ps &> /dev/null; then
            log_pass "Docker daemon 正在運行"
        else
            log_fail "Docker daemon 未運行"
        fi
    else
        log_fail "Docker 未安裝"
    fi
}

check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
        log_pass "Docker Compose 已安裝 (版本: $COMPOSE_VERSION)"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_pass "Docker Compose 已安裝 (版本: $COMPOSE_VERSION)"
    else
        log_fail "Docker Compose 未安裝"
    fi
}

check_env_files() {
    if [ -f ".env" ]; then
        log_pass ".env 檔案存在"

        # Check for default passwords
        if grep -q "your.*password" .env 2>/dev/null; then
            log_warning ".env 包含預設密碼，請務必修改"
        else
            log_pass ".env 未包含明顯的預設密碼"
        fi

        # Check required variables
        REQUIRED_VARS=("NODE_ENV" "REDIS_PASSWORD" "SESSION_SECRET" "JWT_SECRET")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^${var}=" .env; then
                log_pass "必要變數 ${var} 已設定"
            else
                log_fail "必要變數 ${var} 未設定"
            fi
        done
    else
        log_fail ".env 檔案不存在"
        log_info "執行: cp .env.docker .env"
    fi
}

check_ports() {
    PORTS=(80 3001 6379)
    PORT_NAMES=("HTTP (前端)" "API (後端)" "Redis")

    for i in "${!PORTS[@]}"; do
        PORT=${PORTS[$i]}
        NAME=${PORT_NAMES[$i]}

        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
            log_warning "Port $PORT ($NAME) 已被使用"
        else
            log_pass "Port $PORT ($NAME) 可用"
        fi
    done
}

check_disk_space() {
    AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$AVAILABLE" -gt 10 ]; then
        log_pass "磁碟空間充足 (${AVAILABLE}GB 可用)"
    elif [ "$AVAILABLE" -gt 5 ]; then
        log_warning "磁碟空間偏低 (${AVAILABLE}GB 可用，建議至少 10GB)"
    else
        log_fail "磁碟空間不足 (${AVAILABLE}GB 可用，需要至少 10GB)"
    fi
}

check_memory() {
    if command -v free &> /dev/null; then
        AVAILABLE_MB=$(free -m | awk 'NR==2{print $7}')
        if [ "$AVAILABLE_MB" -gt 2048 ]; then
            log_pass "記憶體充足 (${AVAILABLE_MB}MB 可用)"
        elif [ "$AVAILABLE_MB" -gt 1024 ]; then
            log_warning "記憶體偏低 (${AVAILABLE_MB}MB 可用，建議至少 2GB)"
        else
            log_fail "記憶體不足 (${AVAILABLE_MB}MB 可用，需要至少 2GB)"
        fi
    else
        log_info "無法檢查記憶體（free 指令不可用）"
    fi
}

check_script_syntax() {
    SCRIPTS=("docker-scripts.sh" "setup.sh" "frontend/entrypoint.sh")

    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            if bash -n "$script" 2>/dev/null; then
                log_pass "$script 語法正確"
            else
                log_fail "$script 語法錯誤"
            fi
        else
            log_warning "$script 不存在"
        fi
    done
}

check_docker_compose_syntax() {
    if [ -f "docker-compose.yml" ]; then
        if docker compose -f docker-compose.yml config > /dev/null 2>&1 || docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
            log_pass "docker-compose.yml 語法正確"
        else
            log_fail "docker-compose.yml 語法錯誤"
        fi
    else
        log_fail "docker-compose.yml 不存在"
    fi
}

check_ssl_certificates() {
    if [ -d "ssl" ]; then
        if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
            log_pass "SSL 憑證檔案存在"

            # Check certificate expiry (if openssl is available)
            if command -v openssl &> /dev/null; then
                EXPIRY=$(openssl x509 -enddate -noout -in ssl/cert.pem 2>/dev/null | cut -d= -f2)
                if [ $? -eq 0 ]; then
                    log_info "SSL 憑證到期日: $EXPIRY"
                fi
            fi
        else
            log_warning "SSL 目錄存在但憑證檔案不完整"
            log_info "如需使用 HTTPS，請準備 ssl/cert.pem 和 ssl/key.pem"
        fi
    else
        log_info "未設定 SSL 憑證（如需 HTTPS 請建立 ssl/ 目錄並放入憑證）"
    fi
}

check_git_status() {
    if [ -d ".git" ]; then
        if git diff-index --quiet HEAD -- 2>/dev/null; then
            log_pass "Git 工作目錄乾淨"
        else
            log_warning "Git 工作目錄有未提交的變更"
        fi

        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        log_info "目前分支: $BRANCH"
    fi
}

# Main execution
main() {
    log_info "luckygo 部署前檢查開始..."
    log_info "執行路徑: $(pwd)"
    log_info "執行時間: $(date)"

    log_section "系統需求檢查"
    check_docker
    check_docker_compose
    check_disk_space
    check_memory

    log_section "網路 Port 檢查"
    check_ports

    log_section "設定檔檢查"
    check_env_files
    check_script_syntax
    check_docker_compose_syntax

    log_section "SSL 憑證檢查"
    check_ssl_certificates

    log_section "版本控制檢查"
    check_git_status

    # Summary
    log_section "檢查結果摘要"
    echo -e "${GREEN}通過: $PASSED${NC}"
    echo -e "${YELLOW}警告: $WARNINGS${NC}"
    echo -e "${RED}失敗: $FAILED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}🎉 所有檢查通過！可以開始部署。${NC}"
            echo ""
            echo "執行部署："
            echo "  ./docker-scripts.sh prod:up      # 標準部署"
            echo "  ./docker-scripts.sh prod:nginx   # 使用 Nginx (HTTPS)"
            exit 0
        else
            echo -e "${YELLOW}⚠️  檢查通過但有警告。請檢視警告訊息後決定是否繼續部署。${NC}"
            exit 0
        fi
    else
        echo -e "${RED}❌ 檢查失敗！請修正上述問題後再進行部署。${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
