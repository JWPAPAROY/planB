# 플랜비 - 은퇴설계 커뮤니티 MVP

## 📋 프로젝트 개요 (2025년 8월 최종 업데이트)
- **프로젝트명**: 플랜비 (PlanB) - 은퇴설계 커뮤니티 플랫폼
- **위치**: `/home/knoww/planb-2.0-project/calculator-app`
- **기술 스택**: HTML, CSS, JavaScript, React 18, Tailwind CSS, Supabase PostgreSQL
- **현재 단계**: MVP 완료 - 은퇴생활비 계산기 + 커뮤니티 기능 
- **배포 준비**: ✅ 완료, GitHub Pages 배포 가능
- **최종 업데이트**: 2025년 8월 21일

## 🎯 MVP 구현된 핵심 기능

### 1. 은퇴생활비 계산기
- **기본 정보 입력**: 연령, 건강상태, 생활방식, 주거형태
- **자산 정보**: 주택가격, 금융자산, 퇴직금, 연금 정보
- **대출 관리**: 한국 원리금균등상환 방식 지원, 대출 완료년도 설정 가능
- **지출 내역**: 세부 생활비 항목별 입력
- **계산 결과**: 은퇴시점 부족액, 월 필요저축액 자동 계산

### 2. 커뮤니티 시스템
- **프로그레시브 접근**: 게시글 목록은 자유 열람, 상세보기/글쓰기는 계산 완료 후
- **게스트/회원 구분**: 게스트는 회원가입 유도, 회원은 계산 완료 여부 확인
- **게시글 관리**: 작성, 조회, 댓글, 좋아요 기능
- **사용자 친화적 UI**: 모바일 최적화, 직관적 네비게이션

### 3. 사용자 인증 시스템
- **게스트 모드**: 임시 사용자로 계산기 사용 가능
- **회원 등록**: 이메일/비밀번호 기반 회원가입
- **데이터 연결**: 게스트→회원 전환시 데이터 이관
## 🛠️ 기술 아키텍처

### 프론트엔드
- **Single File Application**: 모든 기능이 하나의 index.html 파일에 통합
- **React 18**: CDN 방식으로 로드, JSX Babel 변환
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **모바일 최적화**: 완전 반응형 디자인, 터치 인터페이스

### 백엔드
- **Supabase**: PostgreSQL + 실시간 구독 + 인증
- **프로젝트 URL**: `https://iopidkmpoxcctixchkmv.supabase.co`
- **Row Level Security**: 게스트/회원 권한 관리
- **실시간 기능**: 커뮤니티 게시글/댓글 실시간 업데이트

### 파일 구조
```
/home/knoww/planb-2.0-project/calculator-app/
├── index.html          # 단일 파일 React 애플리케이션 (3,870 lines)
├── CLAUDE.md          # 프로젝트 문서 (이 파일)
└── README.md          # 기본 설명서
```

### 데이터베이스 스키마 (Supabase)
```sql
-- 사용자 계산 데이터
CREATE TABLE user_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT,
  age_group TEXT,
  health_status TEXT,
  life_mode TEXT,
  housing_type TEXT,
  housing_value BIGINT,
  financial_assets BIGINT,
  home_mortgage BIGINT,
  home_mortgage_payment INTEGER,
  know_loan_end_year BOOLEAN,
  loan_end_year TEXT,
  severance_pay BIGINT,
  national_pension INTEGER,
  private_pension INTEGER,
  calculation_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지출 데이터
CREATE TABLE user_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES user_calculations(id),
  food_expenses INTEGER,
  communication_expenses INTEGER,
  utilities_expenses INTEGER,
  living_expenses INTEGER,
  medical_expenses INTEGER,
  hobby_expenses INTEGER,
  total_monthly_expenses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커뮤니티 게시글
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글 댓글
CREATE TABLE community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_hash TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게스트 계산 데이터 (임시)
CREATE TABLE guest_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  calculation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
## 🎨 MVP 핵심 기능 상세

### 1. 은퇴생활비 계산기
- **대출 입력 방식**: 한국식 원리금균등상환 지원
  - 월 상환액 직접 입력
  - 대출 완료년도 설정으로 은퇴 후 절약액 계산
- **계산 로직**: 단순하고 직관적인 자산 소진 방식
- **결과 제공**: 부족액, 월 필요저축액, 일별 생활비

### 2. 프로그레시브 커뮤니티
- **접근 전략**: 게시글 목록 자유 열람 → 상세보기/글쓰기는 계산 완료 후
- **게스트/회원 구분**: 
  - 게스트: 회원가입 유도
  - 회원: 계산 완료 여부 확인
- **익명성 보장**: 개인정보 없는 커뮤니티 참여

### 3. 사용자 경험 최적화
- **단일 파일 구조**: 3,870라인의 완전한 React 애플리케이션
- **모바일 최적화**: 터치 인터페이스, 반응형 디자인
- **직관적 UI**: X 버튼, 뒤로가기 화살표, 일관된 모달 시스템

## 📊 현재 개발 상태 (2025년 8월 최종)

### ✅ 완료된 기능 (100%)
- **은퇴생활비 계산기**: 한국식 대출 방식 지원, 완전한 계산 로직
- **커뮤니티 시스템**: 프로그레시브 접근, 게시글/댓글 기능
- **사용자 인증**: 게스트/회원 구분, Supabase Auth 연동
- **UI/UX**: 모바일 최적화, 모든 모달에 X 버튼, 뒤로가기 화살표
- **데이터베이스**: Supabase 연동 완료, 스키마 구축

### 🚀 배포 준비 상태
- **프론트엔드**: GitHub Pages 배포 가능 (index.html 단일 파일)
- **백엔드**: Supabase 프로덕션 환경 연결
## 💡 향후 발전 계획

### 단기 목표 (3개월)
- **사용자 피드백 수집**: MVP 서비스 런칭 후 개선사항 도출
- **커뮤니티 활성화**: 초기 사용자 모집 및 콘텐츠 축적
- **계산기 정확도 개선**: 실제 사용 데이터 기반 알고리즘 최적화

### 중기 목표 (6개월)
- **전문가 매칭 시스템**: 금융상담 전문가 온보딩
- **모바일 앱 개발**: 네이티브 앱 또는 PWA 전환
- **고급 분석 기능**: 자산 포트폴리오 분석, 시뮬레이션 기능

### 장기 목표 (12개월)
- **멀티 전문가 플랫폼**: 건강, 부동산, 법무 상담 확장
- **AI 챗봇 도입**: 1차 상담 자동화
- **오프라인 연계**: 지역별 세미나, 모임 서비스

---

**프로젝트 상태**: ✅ **MVP 완료**  
**최종 업데이트**: 2025년 8월 21일  
**배포 준비**: ✅ GitHub Pages 배포 가능  
**핵심 기능**: 은퇴생활비 계산기 + 프로그레시브 커뮤니티

