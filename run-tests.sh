#!/bin/bash

# 플랜비 자동 테스트 실행 스크립트
# 사용법: ./run-tests.sh [옵션]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🧪 플랜비 자동 테스트 시스템${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

# 환경 확인
check_environment() {
    print_info "환경 설정 확인 중..."
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        print_error "Node.js가 설치되지 않았습니다."
        exit 1
    fi
    
    # npm 확인
    if ! command -v npm &> /dev/null; then
        print_error "npm이 설치되지 않았습니다."
        exit 1
    fi
    
    # .env 파일 확인
    if [ ! -f ".env" ]; then
        print_warning ".env 파일이 없습니다. .env.example을 복사하세요."
        cp .env.example .env
        print_info ".env 파일이 생성되었습니다. 설정을 확인하세요."
    fi
    
    # package.json 확인
    if [ ! -f "package.json" ]; then
        print_error "package.json 파일이 없습니다."
        exit 1
    fi
    
    print_success "환경 설정 확인 완료"
}

# 의존성 설치
install_dependencies() {
    print_info "의존성 설치 중..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "의존성 설치 완료"
    else
        print_info "의존성이 이미 설치되어 있습니다."
    fi
    
    # Playwright 브라우저 설치
    if [ ! -d "node_modules/@playwright" ]; then
        print_error "Playwright가 설치되지 않았습니다."
        exit 1
    fi
    
    # 브라우저 확인
    print_info "Playwright 브라우저 설치 확인 중..."
    npx playwright install chromium firefox webkit
    print_success "브라우저 설치 완료"
}

# 테스트 서버 시작
start_test_server() {
    print_info "테스트 서버 시작 중..."
    
    # 기존 서버 종료
    pkill -f "python3 -m http.server 8000" 2>/dev/null || true
    
    # 새 서버 시작
    python3 -m http.server 8000 > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # 서버 준비 대기
    sleep 3
    
    # 서버 상태 확인
    if curl -s http://localhost:8000 > /dev/null; then
        print_success "테스트 서버 시작 완료 (PID: $SERVER_PID)"
        echo $SERVER_PID > .server.pid
    else
        print_error "테스트 서버 시작 실패"
        exit 1
    fi
}

# 테스트 서버 종료
stop_test_server() {
    if [ -f ".server.pid" ]; then
        SERVER_PID=$(cat .server.pid)
        kill $SERVER_PID 2>/dev/null || true
        rm .server.pid
        print_info "테스트 서버 종료 (PID: $SERVER_PID)"
    fi
}

# 테스트 데이터 생성
seed_test_data() {
    print_info "테스트 데이터 생성 중..."
    
    # 환경변수 로드
    set -a; source .env; set +a
    
    if npm run test:seed; then
        print_success "테스트 데이터 생성 완료"
    else
        print_error "테스트 데이터 생성 실패"
        return 1
    fi
}

# 테스트 데이터 정리
cleanup_test_data() {
    print_info "테스트 데이터 정리 중..."
    
    # 환경변수 로드
    set -a; source .env; set +a
    
    if npm run test:cleanup; then
        print_success "테스트 데이터 정리 완료"
    else
        print_warning "테스트 데이터 정리에 일부 실패가 있었습니다."
    fi
}

# 테스트 실행
run_tests() {
    local test_type=$1
    
    print_info "테스트 실행 중 (타입: $test_type)..."
    
    case $test_type in
        "full")
            npm run test
            ;;
        "ui")
            npm run test:ui
            ;;
        "headed")
            npm run test:headed
            ;;
        "debug")
            npm run test:debug
            ;;
        "performance")
            npm run test -- --grep "performance"
            ;;
        "mobile")
            npm run test -- --project="Mobile Chrome" --project="Mobile Safari"
            ;;
        "specific")
            if [ -z "$2" ]; then
                print_error "테스트 파일명을 지정해주세요. 예: ./run-tests.sh specific calculator"
                exit 1
            fi
            npm run test -- --grep "$2"
            ;;
        *)
            npm run test
            ;;
    esac
}

# 테스트 결과 리포트
show_report() {
    if [ -d "playwright-report" ]; then
        print_info "테스트 리포트를 여는 중..."
        npx playwright show-report
    else
        print_warning "테스트 리포트가 생성되지 않았습니다."
    fi
}

# 시스템 상태 확인
check_system_status() {
    print_info "시스템 상태 확인 중..."
    
    # 환경변수 로드
    set -a; source .env; set +a
    
    # Supabase 연결 확인
    if node -e "
        const { createClient } = require('@supabase/supabase-js');
        const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        client.from('user_profiles').select('count').limit(1).then(
            () => { console.log('✅ Supabase 연결 성공'); process.exit(0); }
        ).catch(
            (e) => { console.log('❌ Supabase 연결 실패:', e.message); process.exit(1); }
        );
    " 2>/dev/null; then
        print_success "Supabase 데이터베이스 연결 정상"
    else
        print_error "Supabase 데이터베이스 연결 실패"
        return 1
    fi
    
    # 웹서버 상태 확인
    if curl -s http://localhost:8000 > /dev/null; then
        print_success "웹서버 상태 정상"
    else
        print_warning "웹서버가 실행되지 않았습니다."
    fi
    
    # 테스트 데이터 현황
    node scripts/cleanup-test-data.js stats 2>/dev/null || print_warning "테스트 데이터 현황을 가져올 수 없습니다."
}

# 전체 테스트 실행
run_full_test_suite() {
    print_header
    
    # 환경 확인
    check_environment
    
    # 의존성 설치
    install_dependencies
    
    # 시스템 상태 확인
    check_system_status
    
    # 테스트 서버 시작
    start_test_server
    
    # 기존 테스트 데이터 정리
    cleanup_test_data
    
    # 새 테스트 데이터 생성
    if seed_test_data; then
        print_info "테스트 실행 시작..."
        
        # 테스트 실행
        if run_tests "full"; then
            print_success "모든 테스트가 성공적으로 완료되었습니다! 🎉"
            TEST_RESULT=0
        else
            print_error "일부 테스트가 실패했습니다."
            TEST_RESULT=1
        fi
        
        # 테스트 데이터 정리
        cleanup_test_data
    else
        print_error "테스트 데이터 생성 실패로 테스트를 중단합니다."
        TEST_RESULT=1
    fi
    
    # 서버 종료
    stop_test_server
    
    return $TEST_RESULT
}

# 메인 로직
main() {
    local command=${1:-"full"}
    
    case $command in
        "help"|"-h"|"--help")
            echo "사용법: $0 [명령어] [옵션]"
            echo ""
            echo "명령어:"
            echo "  full        전체 테스트 실행 (기본값)"
            echo "  ui          UI 모드로 테스트 실행"
            echo "  headed      브라우저 표시 모드"
            echo "  debug       디버그 모드"
            echo "  performance 성능 테스트만 실행"
            echo "  mobile      모바일 테스트만 실행"
            echo "  specific    특정 테스트 실행 (예: specific calculator)"
            echo "  status      시스템 상태 확인"
            echo "  seed        테스트 데이터 생성"
            echo "  cleanup     테스트 데이터 정리"
            echo "  report      테스트 리포트 열기"
            echo "  setup       초기 환경 설정"
            echo ""
            echo "예시:"
            echo "  $0 full              # 전체 테스트 실행"
            echo "  $0 ui                # UI 모드로 테스트"
            echo "  $0 specific calculator # 계산기 테스트만 실행"
            echo "  $0 status            # 시스템 상태 확인"
            ;;
        "setup")
            print_header
            check_environment
            install_dependencies
            print_success "환경 설정이 완료되었습니다!"
            ;;
        "status")
            print_header
            check_system_status
            ;;
        "seed")
            seed_test_data
            ;;
        "cleanup")
            cleanup_test_data
            ;;
        "report")
            show_report
            ;;
        "server:start")
            start_test_server
            print_info "서버가 실행 중입니다. 중지하려면 '$0 server:stop'을 실행하세요."
            ;;
        "server:stop")
            stop_test_server
            ;;
        "full")
            if run_full_test_suite; then
                print_success "🎉 전체 테스트 완료!"
                show_report
                exit 0
            else
                print_error "❌ 테스트 실패"
                exit 1
            fi
            ;;
        *)
            # 개별 테스트 실행
            check_environment
            start_test_server
            
            if run_tests "$command" "$2"; then
                print_success "테스트 완료!"
                stop_test_server
                exit 0
            else
                print_error "테스트 실패"
                stop_test_server
                exit 1
            fi
            ;;
    esac
}

# 스크립트 실행 시 자동 정리 설정
trap 'stop_test_server; exit 1' INT TERM

# 메인 함수 실행
main "$@"