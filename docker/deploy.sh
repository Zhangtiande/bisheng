#!/bin/bash

# 部署脚本
# 用法: ./deploy.sh <environment> <component> <version>
# environment: production, staging, development
# component: frontend, backend, both
# version: docker镜像标签

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 3 ]; then
    log_error "Usage: $0 <environment> <component> <version>"
    log_error "  environment: production, staging, development"
    log_error "  component: frontend, backend, both"
    log_error "  version: docker image tag"
    exit 1
fi

ENVIRONMENT=$1
COMPONENT=$2
VERSION=$3

# 验证环境参数
case $ENVIRONMENT in
    production|staging|development)
        log_info "Deploying to $ENVIRONMENT environment"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid environments: production, staging, development"
        exit 1
        ;;
esac

# 验证组件参数
case $COMPONENT in
    frontend|backend|both)
        log_info "Deploying component: $COMPONENT"
        ;;
    *)
        log_error "Invalid component: $COMPONENT"
        log_error "Valid components: frontend, backend, both"
        exit 1
        ;;
esac

# 设置环境变量和部署目录
export VERSION=$VERSION



# 拉取Docker镜像
pull_images() {
    log_info "Pulling Docker images for version $VERSION..."
    
    case $COMPONENT in
        frontend)
            docker pull "10.191.6.39:8085/ycopilot-v2/ycopilot-manage:$VERSION"
            ;;
        backend)
            docker pull "10.191.6.39:8085/ycopilot-v2/ycopilot-core:$VERSION"
            ;;
        both)
            docker pull "10.191.6.39:8085/ycopilot-v2/ycopilot-manage:$VERSION"
            docker pull "10.191.6.39:8085/ycopilot-v2/ycopilot-core:$VERSION"
            ;;
    esac
    
    log_success "Images pulled successfully"
}

# 部署服务
deploy_services() {
    log_info "Deploying services..."
    
    case $COMPONENT in
        frontend)
            log_info "Deploying frontend..."
            docker compose up -d frontend
            ;;
        backend)
            log_info "Deploying backend and dependencies..."
            docker compose up -d backend
            ;;
        both)
            log_info "Deploying all services..."
            docker compose up -d backend frontend
            ;;
    esac
    
    log_success "Services deployed successfully"
}

# 主执行流程
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Component: $COMPONENT"
    log_info "Version: $VERSION"
    
    # 检查Docker和docker-compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "docker compose is not installed or not in PATH"
        exit 1
    fi
    
    # 执行部署步骤
    switch_to_deploy_dir
    pull_images
    deploy_services
    
    log_info "Successfully deployed"
   
}

# 执行主函数
main "$@" 