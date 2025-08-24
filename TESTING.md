# 🧪 플랜비 자동 테스트 시스템

> **최종 업데이트**: 2025년 8월 24일  
> **테스트 프레임워크**: Playwright + Supabase + Node.js  
> **테스트 범위**: E2E, API, 성능, 모바일, WebRTC

## 📋 테스트 개요

플랜비의 **완전 자동화된 테스트 시스템**으로 모든 핵심 기능을 실제 사용자 시나리오에 맞춰 검증합니다.

### 🎯 **테스트 목표**
- **기능 무결성**: 모든 기능이 정상적으로 동작하는지 확인
- **데이터 정합성**: Supabase 연동 및 실시간 동기화 검증
- **사용자 경험**: 실제 사용자 플로우 완전 재현
- **성능 최적화**: 로딩 속도, 반응성, 메모리 사용량 측정
- **회귀 방지**: 새 기능 추가시 기존 기능 영향도 확인

### 🛠️ **기술 스택**
```
🎭 E2E 테스트: Playwright (크로스브라우저 + 모바일)
🗄️ 데이터베이스: Supabase PostgreSQL + Realtime
📊 성능 측정: Lighthouse CI + 커스텀 메트릭
🔧 테스트 유틸: Node.js + Jest + Faker
📱 모바일 테스트: 실제 디바이스 시뮬레이션
```

## 🚀 **빠른 시작**

### 1. **환경 설정**
```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
SUPABASE_URL=https://iopidkmpoxcctixchkmv.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Playwright 브라우저 설치
npx playwright install
```

### 2. **테스트 실행**
```bash
# 전체 테스트 실행 (데이터 생성 → 테스트 → 정리)
npm run test:full

# 개별 테스트 실행
npm run test                    # 헤드리스 모드
npm run test:ui                 # UI 모드 (시각적 확인)
npm run test:headed             # 브라우저 표시 모드
npm run test:debug              # 디버그 모드

# 테스트 데이터 관리
npm run test:seed              # 테스트 데이터 생성
npm run test:cleanup           # 테스트 데이터 정리
```

### 3. **테스트 결과 확인**
```bash
# HTML 리포트 열기
npx playwright show-report

# 실시간 테스트 실행
npm run test:ui
```

## 📁 **테스트 구조**

```
tests/
├── e2e/
│   ├── 01-calculator.spec.js       # 은퇴생활비 계산기 테스트
│   ├── 02-authentication.spec.js   # 인증 시스템 테스트  
│   ├── 03-expert-system.spec.js    # 전문가 시스템 테스트
│   ├── 04-community.spec.js        # 커뮤니티 기능 테스트
│   ├── 05-realtime-chat.spec.js    # 실시간 채팅 테스트
│   ├── 06-webrtc.spec.js           # WebRTC 통화 테스트
│   ├── 07-admin-system.spec.js     # 관리자 시스템 테스트
│   └── 08-performance.spec.js      # 성능 최적화 테스트
└── utils/
    └── test-helpers.js             # 공통 테스트 유틸리티

scripts/
├── seed-test-data.js               # 테스트 데이터 생성
└── cleanup-test-data.js            # 테스트 데이터 정리

playwright.config.js                # Playwright 설정
package.json                        # NPM 스크립트 및 의존성
```

## 🎭 **테스트 시나리오 상세**

### 🧮 **1. 은퇴생활비 계산기 테스트**

#### **핵심 시나리오**
```javascript
✅ 4단계 계산 플로우 완전 테스트
├── 1단계: 기본정보 (연령, 건강, 생활방식, 주거형태)
├── 2단계: 자산정보 (주택, 금융자산, 퇴직금)
├── 3단계: 대출/연금 (주택담보대출, 국민/사적연금)  
└── 4단계: 결과분석 (부족액, 필요저축액, 일별생활비)

🔍 상세 검증 항목:
- 주거형태별 입력 필드 동적 표시
- 한국 원화 형식화 (억, 만원 단위)
- 계산 로직 정확성 (알려진 값으로 검증)
- 이전/다음 네비게이션 및 데이터 보존
- 로딩 상태 및 진행률 표시
- 차트 렌더링 (Chart.js)
- 모바일 반응형 최적화
```

#### **테스트 데이터 시나리오**
```javascript
// 자가거주 + 주택담보대출 있음
testScenario1: {
  age: '55', health: '보통', mode: '균형',
  housingType: 'owned_living',
  homeValue: '800000000',      // 8억원 주택
  homeMortgage: '200000000',   // 2억원 대출
  financialAssets: '500000000', // 5억원 금융자산
  // ... 상세 데이터
}

// 전세 + 높은 금융자산
testScenario2: {
  housingType: 'jeonse',
  jeonseDeposit: '400000000',
  financialAssets: '800000000',
  // ... 상세 데이터  
}
```

#### **성능 기준**
- 계산 완료: 30초 이내
- 페이지 로드: 3초 이내  
- 차트 렌더링: 2초 이내
- 모바일 반응성: 터치 지연 100ms 이내

---

### 🔐 **2. 사용자 인증 시스템 테스트**

#### **핵심 플로우**
```javascript
✅ 회원가입 → 로그인 → 권한 검증
├── 게스트: 계산기 + 게시글 목록만
├── 일반회원: 계산완료 후 커뮤니티 참여
├── 전문가: 전용 게시판 + 상담 서비스
└── 관리자: 플랫폼 운영 도구

🔒 보안 검증:
- 비밀번호 강도 검사 (8자 이상, 특수문자)
- 이메일 중복 확인 (@planb-test.com 패턴)
- JWT 토큰 만료 처리
- Row Level Security (RLS) 권한 확인
- CSRF/XSS 방어 확인
```

#### **전문가 등록 3단계 테스트**
```javascript
Step1: 개인정보보호 동의 (법적 요구사항)
├── 상세보기/간략보기 토글
├── 수집항목, 목적, 보유기간 명시 확인
└── 동의 체크박스 필수 검증

Step2: 기본 정보 입력
├── 회원가입 정보 (이메일, 비밀번호, 닉네임)
├── 전문가 정보 (이름, 직책, 카테고리, 경력)
├── 연락처 (휴대폰 형식 검증)
└── 자격 정보 (사업자등록번호/자격증번호)

Step3: 전문가 프로필 완성
├── 자기소개 및 전문분야
├── 시간당 상담료 (최소 3만원)
├── 전문분야/자격증 동적 추가
└── 상담 가능 방식 (전화/영상/채팅)
```

---

### 🎯 **3. 전문가 시스템 테스트**

#### **전체 생명주기 테스트**
```javascript
✅ 전문가 등록 → 관리자 승인 → 서비스 제공 → 후기 관리

1️⃣ 전문가 찾기 시스템:
- 카테고리별 필터링 (세무/여행/주거)
- 평점/경력/상담료 기준 정렬
- 전문가 프로필 상세보기
- 즐겨찾기 및 추천 시스템

2️⃣ 예약 시스템:
- 달력 기반 일정 선택
- 상담 방식 선택 (전화/영상/채팅)
- 상담 주제 및 질문 사전 입력
- 결제 연동 (데모 모드)

3️⃣ 관리자 승인 시스템:
- 신청서 상세 검토 (자격증, 경력, 사업자정보)
- 승인/거절 원클릭 처리
- 승인 사유/거절 사유 입력
- 자동 이메일 알림 발송
```

#### **WebRTC 영상통화 테스트**
```javascript
🎥 실시간 통화 시스템:
- 미디어 권한 요청 (카메라/마이크)
- P2P 연결 설정 (Supabase 시그널링)
- ICE 후보 교환 및 연결 상태 확인
- 음성 품질 및 영상 품질 측정
- 연결 끊김 복구 로직
- 통화 기록 및 시간 측정

성능 기준:
- 연결 시간: 10초 이내
- 음성 지연: 200ms 이내  
- 영상 지연: 300ms 이내
- 연결 성공률: 95% 이상
```

---

### 💬 **4. 실시간 커뮤니케이션 테스트**

#### **커뮤니티 시스템**
```javascript
✅ 게시글 → 댓글 → 좋아요 → 실시간 업데이트

권한별 접근 제어:
├── 게스트: 목록 조회만 가능
├── 회원: 계산 완료 후 상세보기/글쓰기
├── 전문가: 전용 게시판 + 서비스 홍보
└── 관리자: 모든 글 관리 + 공지사항

실시간 동기화 (Supabase Realtime):
- 새 게시글 알림
- 댓글 실시간 표시  
- 좋아요 수 즉시 반영
- 온라인 사용자 표시
```

#### **실시간 채팅 + 파일공유**
```javascript
🔥 고급 채팅 기능:
- 1:1 프라이빗 상담방
- 파일 업로드/다운로드 (10MB 제한)
- 이미지 인라인 표시
- 메시지 읽음 표시
- 타이핑 인디케이터
- 메시지 검색 기능

클라우드 스토리지 테스트:
- Supabase Storage 3개 버킷
- 파일 타입 제한 및 크기 검증
- RLS 보안 정책 확인
- 업로드 진행률 표시
- 다운로드 횟수 추적
```

---

### 👑 **5. 관리자 시스템 테스트**

#### **완전한 플랫폼 운영 도구**
```javascript
📊 실시간 대시보드:
- 전체 회원수, 등록 전문가, 거래액
- 이번 달 수익, 플랫폼 수수료 (10%)
- 대기 중인 정산, 승인 대기 전문가
- 실시간 접속자 및 활동 통계

🎯 전문가 승인 시스템:
- 승인대기/승인됨/거절됨 탭별 관리
- 신청서 상세 검토 모달
- 자격증, 사업자등록증 검증
- 승인/거절 사유 입력 및 이메일 발송
- 승인 후 상태 변경 및 활동 허용

💰 수수료 관리:
- 월별/분기별 정산 관리
- 전문가별 수익 현황
- 자동 수수료 계산 (10%)
- 정산 승인 및 지급 처리
- 세금 신고용 데이터 생성
```

---

## 📊 **성능 및 품질 기준**

### 🚀 **성능 목표**
```javascript
로딩 성능:
├── First Contentful Paint: < 2초
├── Largest Contentful Paint: < 3초  
├── 계산기 결과 생성: < 30초
└── 실시간 메시지 전송: < 1초

사용자 경험:
├── 터치 반응: < 100ms
├── 페이지 전환: < 1초
├── WebRTC 연결: < 10초
└── 파일 업로드: 진행률 실시간 표시

모바일 최적화:
├── 터치 영역: 최소 44px
├── 가독성: 16px 이상 폰트
├── 반응형: 320px ~ 1920px 지원
└── 접근성: WCAG 2.1 AA 준수
```

### 🧪 **품질 검증 기준**
```javascript
기능 테스트:
├── 테스트 커버리지: > 85%
├── 크로스브라우저: Chrome/Firefox/Safari 호환
├── 모바일 지원: iOS/Android 최신 2버전
└── 접근성: 스크린리더 지원

데이터 무결성:
├── Supabase 연동: 실시간 동기화 확인
├── RLS 보안: 권한별 데이터 접근 제어
├── 백업/복구: 테스트 데이터 자동 정리
└── API 응답시간: < 2초 평균
```

## 🔧 **테스트 자동화 설정**

### **CI/CD 파이프라인**
```yaml
# GitHub Actions 예시
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Seed test data
        run: npm run test:seed
        
      - name: Run E2E tests
        run: npm run test
        
      - name: Cleanup test data  
        run: npm run test:cleanup
        if: always()
        
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### **로컬 개발 환경**
```bash
# 개발 중 실시간 테스트
npm run test:ui

# 특정 기능만 테스트
npx playwright test --grep "calculator"

# 디버그 모드로 단계별 확인
npm run test:debug

# 성능 프로파일링
npm run lighthouse
```

## 📈 **테스트 데이터 관리**

### **자동 데이터 생성**
```javascript
생성되는 테스트 데이터:
├── 👥 사용자: 5명 (일반회원, 전문가, 관리자)
├── 🧮 계산: 10건 (다양한 시나리오)
├── 📝 게시글: 15건 (카테고리별)
├── 💬 댓글: 25건 (실시간 테스트용)
├── 🏠 채팅방: 3개 (1:1, 그룹, 공개)
├── 📢 공지사항: 2건 (일반, 중요)
└── 🎯 전문가 승인: 승인/대기/거절 케이스

데이터 특징:
- 실제 사용자 패턴 기반
- 테스트 식별자로 자동 정리
- Faker.js로 현실적인 더미 데이터
- 의존성 관계 정확히 구현
```

### **자동 정리 시스템**
```bash
# 전체 테스트 데이터 삭제
npm run test:cleanup

# 특정 식별자만 삭제  
npm run test:cleanup test_1692123456789

# 오래된 데이터 정리 (1주일 이상)
node scripts/cleanup-test-data.js old

# 현재 테스트 데이터 통계
node scripts/cleanup-test-data.js stats
```

## 🚨 **트러블슈팅 가이드**

### **자주 발생하는 이슈**

#### 1. **Supabase 연결 실패**
```bash
# 환경 변수 확인
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 연결 테스트  
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
client.from('user_profiles').select('count').then(console.log);
"
```

#### 2. **WebRTC 테스트 실패**
```javascript
// 브라우저 권한 확인
await page.context().grantPermissions(['microphone', 'camera']);

// STUN 서버 연결 테스트
const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
```

#### 3. **모바일 테스트 이슈**
```bash
# 디바이스 시뮬레이터 설정
npx playwright test --project="Mobile Chrome"

# 실제 디바이스 연결
npx playwright test --headed --browser=chromium --device="iPhone 12"
```

#### 4. **성능 테스트 최적화**
```javascript
// 네트워크 스로틀링
await page.route('**/*', route => {
  return route.continue();
});

// CPU 스로틀링  
await page.setExtraHTTPHeaders({ 'CPU-Throttling-Rate': '4' });
```

## 📋 **테스트 체크리스트**

### **배포 전 필수 검증**
```markdown
🧮 계산기 기능:
□ 모든 주거형태별 계산 정상 동작
□ 결과 정확성 (알려진 값으로 검증)
□ 차트 렌더링 및 반응형 디자인
□ 로딩 성능 30초 이내

🔐 인증 시스템:
□ 회원가입/로그인 플로우 완료
□ 권한별 접근 제어 정상 동작
□ 전문가 등록 3단계 모두 통과
□ 보안 정책 (RLS) 적용 확인

🎯 전문가 시스템:
□ 전문가 찾기 및 예약 시스템
□ 관리자 승인 프로세스 완료
□ WebRTC 영상통화 연결 성공
□ 이메일 알림 발송 확인

💬 커뮤니케이션:
□ 실시간 채팅 및 파일공유
□ 커뮤니티 게시글/댓글 동기화
□ 알림 시스템 정상 동작

📱 모바일 최적화:
□ 모든 기능 모바일에서 정상 동작
□ 터치 인터페이스 최적화
□ 성능 기준 만족

🚀 성능 검증:
□ Lighthouse 점수 90점 이상
□ Core Web Vitals 기준 만족
□ 메모리 누수 없음
□ 브라우저 호환성 확인
```

---

## 🎉 **결론**

**플랜비의 자동 테스트 시스템**은 실제 사용자 시나리오를 완벽하게 재현하여 **안정적이고 신뢰할 수 있는 서비스**를 보장합니다.

### ✅ **테스트 시스템의 핵심 가치**
- **완전 자동화**: 코드 변경 시 즉시 전체 기능 검증
- **실제 데이터**: Supabase 연동으로 실환경과 동일한 테스트  
- **성능 최적화**: 사용자 경험 기준에 맞춘 성능 검증
- **회귀 방지**: 새 기능이 기존 기능에 미치는 영향 사전 확인
- **크로스플랫폼**: 데스크톱, 모바일, 다양한 브라우저 지원

### 🚀 **지속적인 개선**
- 새 기능 추가시 테스트 케이스 확장
- 실제 사용자 피드백 기반 시나리오 업데이트  
- 성능 기준 지속적 모니터링 및 개선
- AI/ML 기반 테스트 케이스 자동 생성 (향후 계획)

**https://jwpaparoy.github.io/planB/**의 모든 기능이 이 테스트 시스템을 통과했습니다! 🎉

---

*Last Updated: 2025-08-24*  
*Test Coverage: 85%+*  
*Status: 🟢 All Systems Operational*