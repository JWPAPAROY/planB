# 📊 플랜비 Supabase 설정 가이드

## 🎯 개요
이 가이드는 플랜비 프로젝트의 백엔드 데이터베이스로 Supabase를 설정하는 방법을 단계별로 안내합니다. Supabase는 PostgreSQL 기반의 오픈소스 Firebase 대안으로, 실시간 데이터베이스, 인증, API를 제공합니다.

## 📋 필요한 준비물
- 이메일 계정 (GitHub 계정 권장)
- 크롬/엣지 등 모던 브라우저
- 기본적인 SQL 지식 (가이드에서 모든 코드 제공)

## 🚀 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 회원가입
1. [Supabase 공식 사이트](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (권장) 또는 이메일로 회원가입
4. 이메일 인증 완료

### 1.2 새 프로젝트 생성
1. 대시보드에서 "New Project" 클릭
2. **Organization**: 개인 계정 선택
3. **Project Name**: `planb-calculator` (또는 원하는 이름)
4. **Database Password**: 강력한 비밀번호 설정 (꼭 기록해두세요!)
5. **Region**: Asia Northeast (Seoul) - ap-northeast-2 선택
6. **Pricing Plan**: Free tier 선택 (월 500MB까지 무료)
7. "Create new project" 클릭
8. ⏰ 프로젝트 생성까지 약 2-3분 대기

## 🗄️ 2단계: 데이터베이스 스키마 구축

### 2.1 SQL Editor 접속
1. 프로젝트 대시보드 → 좌측 메뉴 → "SQL Editor" 클릭
2. "New query" 클릭

### 2.2 테이블 생성 SQL 실행

**아래 SQL 코드를 복사하여 SQL Editor에 붙여넣고 실행하세요:**

```sql
-- ================================
-- 플랜비 데이터베이스 스키마
-- ================================

-- 1. 사용자 계산 데이터 테이블 (익명)
CREATE TABLE user_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT, -- 익명 식별자 (선택적)
  
  -- 기본 정보
  age INTEGER,
  age_group TEXT, -- '50-59', '60-69', '70-79', '80+'
  health_status TEXT, -- '양호', '보통', '주의필요'
  life_mode TEXT, -- '보수적', '균형', '적극적'
  
  -- 자산 정보
  housing_type TEXT, -- '자가', '전세', '월세', '기타'
  housing_value BIGINT, -- 주택 가치 (원)
  financial_assets BIGINT, -- 금융자산 (원)
  severance_pay BIGINT, -- 퇴직금 (원)
  debt BIGINT, -- 부채 (원)
  
  -- 연금 정보  
  national_pension BIGINT, -- 국민연금 월 수령액 (원)
  private_pension BIGINT, -- 사적연금 월 수령액 (원)
  
  -- 계산 결과
  calculation_result JSONB, -- 계산 결과 전체 저장
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 지출 내역 테이블 (또래 비교용)
CREATE TABLE user_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES user_calculations(id) ON DELETE CASCADE,
  
  -- 지출 카테고리 (월 단위, 원)
  food_expenses INTEGER, -- 식비
  communication_expenses INTEGER, -- 통신비
  utilities_expenses INTEGER, -- 주거비 (관리비, 가스, 전기 등)
  living_expenses INTEGER, -- 생활비 (의류, 교통, 쇼핑 등)
  medical_expenses INTEGER, -- 의료비
  hobby_expenses INTEGER, -- 여가/취미비
  
  -- 총 지출
  total_monthly_expenses INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 커뮤니티 게시글 테이블 (익명)
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT NOT NULL, -- 익명 식별자
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'retirement', 'asset', 'life', 'health', 'community'
  
  -- 익명 뱃지 정보
  asset_badge TEXT, -- '1억미만', '1-3억', '3-5억', '5억이상'
  age_badge TEXT, -- '50대', '60대', '70대이상'
  region_badge TEXT, -- '서울', '경기', '부산' 등
  
  -- 상호작용
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 커뮤니티 댓글 테이블
CREATE TABLE community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES community_replies(id), -- 대댓글 지원
  
  -- 상호작용
  likes INTEGER DEFAULT 0,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 금융 전문가 프로필 테이블
CREATE TABLE financial_experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- 자격 및 경력
  credentials TEXT[], -- ["CFP", "AFP", "재무설계사1급", "FP"]
  experience_years INTEGER NOT NULL,
  specializations TEXT[], -- ["노후설계", "자산배분", "세금절약", "보험설계"]
  career_summary TEXT, -- 경력 요약
  introduction TEXT, -- 자기소개
  
  -- 상담 정보
  hourly_rate INTEGER NOT NULL, -- 시간당 상담료 (원)
  available_times JSONB, -- 상담 가능 시간대
  consultation_types TEXT[], -- ["text", "voice", "video"]
  
  -- 평가 및 통계
  rating_average DECIMAL(3,2) DEFAULT 0.00, -- 평균 평점
  total_consultations INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- 계정 상태
  is_verified BOOLEAN DEFAULT false, -- 자격 검증 완료 여부
  verification_documents JSONB, -- 검증 서류 메타데이터
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'suspended'
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 상담 세션 테이블
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 관련 데이터 연결
  user_calculation_id UUID REFERENCES user_calculations(id),
  expert_id UUID REFERENCES financial_experts(id),
  user_hash TEXT, -- 익명 식별자
  
  -- 상담 정보
  consultation_type TEXT NOT NULL, -- 'text', 'voice', 'video'
  session_title TEXT, -- 상담 주제
  user_questions TEXT, -- 사용자 질문 (상담 신청시)
  
  -- 스케줄링
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- 결제 정보
  price_paid INTEGER NOT NULL, -- 실제 결제 금액
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  payment_method TEXT, -- '카드', '계좌이체' 등
  
  -- 상담 상태
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  cancellation_reason TEXT,
  
  -- 상담 결과
  expert_notes TEXT, -- 전문가 상담 기록 (비공개)
  consultation_summary TEXT, -- 상담 요약 (사용자 제공용)
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 상담 후기 및 평가 테이블
CREATE TABLE consultation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE,
  
  -- 평가 점수 (1-5점)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- 후기 내용
  review_title TEXT,
  review_text TEXT,
  pros TEXT, -- 좋았던 점
  improvements TEXT, -- 개선 사항
  
  -- 추천 관련
  would_recommend BOOLEAN,
  recommendation_reason TEXT,
  
  -- 전문가 응답
  expert_response TEXT,
  expert_response_date TIMESTAMP WITH TIME ZONE,
  
  -- 공개 설정
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- 우수 후기 표시
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 인덱스 생성 (성능 최적화)
-- ================================

-- 자주 조회되는 컬럼들에 대한 인덱스
CREATE INDEX idx_user_calculations_age_group ON user_calculations(age_group);
CREATE INDEX idx_user_calculations_created_at ON user_calculations(created_at);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_financial_experts_status ON financial_experts(status);
CREATE INDEX idx_consultation_sessions_status ON consultation_sessions(status);
CREATE INDEX idx_consultation_sessions_scheduled_at ON consultation_sessions(scheduled_at);

-- ================================
-- RLS (Row Level Security) 정책
-- ================================

-- 기본적으로 모든 테이블에 RLS 활성화
ALTER TABLE user_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 읽기 가능한 정책 (커뮤니티 게시글)
CREATE POLICY "Anyone can read community posts" ON community_posts
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Anyone can read community replies" ON community_replies
    FOR SELECT USING (NOT is_deleted);

-- 활성화된 전문가만 조회 가능
CREATE POLICY "Anyone can read active experts" ON financial_experts
    FOR SELECT USING (status = 'active' AND is_verified = true);

-- 공개된 상담 후기만 조회 가능  
CREATE POLICY "Anyone can read published reviews" ON consultation_reviews
    FOR SELECT USING (is_published = true);

-- ================================
-- 유틸리티 함수들
-- ================================

-- 나이를 연령대로 변환하는 함수
CREATE OR REPLACE FUNCTION get_age_group(age INTEGER)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN age < 50 THEN RETURN '50미만';
        WHEN age >= 50 AND age < 60 THEN RETURN '50대';
        WHEN age >= 60 AND age < 70 THEN RETURN '60대';
        WHEN age >= 70 AND age < 80 THEN RETURN '70대';
        ELSE RETURN '80세이상';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 자산을 구간으로 변환하는 함수
CREATE OR REPLACE FUNCTION get_asset_badge(total_assets BIGINT)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN total_assets < 100000000 THEN RETURN '1억미만';
        WHEN total_assets >= 100000000 AND total_assets < 300000000 THEN RETURN '1-3억';
        WHEN total_assets >= 300000000 AND total_assets < 500000000 THEN RETURN '3-5억';
        WHEN total_assets >= 500000000 AND total_assets < 1000000000 THEN RETURN '5-10억';
        ELSE RETURN '10억이상';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 전문가 평점 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_expert_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE financial_experts 
    SET 
        rating_average = (
            SELECT AVG(overall_rating)::DECIMAL(3,2)
            FROM consultation_reviews cr
            JOIN consultation_sessions cs ON cr.session_id = cs.id
            WHERE cs.expert_id = (
                SELECT expert_id 
                FROM consultation_sessions 
                WHERE id = NEW.session_id
            )
            AND cr.is_published = true
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM consultation_reviews cr
            JOIN consultation_sessions cs ON cr.session_id = cs.id
            WHERE cs.expert_id = (
                SELECT expert_id 
                FROM consultation_sessions 
                WHERE id = NEW.session_id
            )
            AND cr.is_published = true
        )
    WHERE id = (
        SELECT expert_id 
        FROM consultation_sessions 
        WHERE id = NEW.session_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_expert_rating
    AFTER INSERT OR UPDATE ON consultation_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_rating();

-- ================================
-- 샘플 데이터 삽입 (테스트용)
-- ================================

-- 샘플 전문가 데이터
INSERT INTO financial_experts (
    name, email, credentials, experience_years, specializations,
    introduction, hourly_rate, consultation_types, is_verified, status
) VALUES 
(
    '김재무', 'kim.financial@example.com', 
    ARRAY['CFP', 'AFP'], 15, ARRAY['노후설계', '자산배분'],
    '15년 경력의 재무설계 전문가입니다. 시니어 고객의 안정적인 노후 준비를 도와드립니다.',
    30000, ARRAY['text', 'voice', 'video'], true, 'active'
),
(
    '박자산', 'park.asset@example.com',
    ARRAY['CFP', '재무설계사1급'], 12, ARRAY['세금절약', '상속설계'],
    '세무 및 상속 전문가로 복잡한 자산 관리 솔루션을 제공합니다.',
    40000, ARRAY['text', 'video'], true, 'active'
),
(
    '이노후', 'lee.retirement@example.com',
    ARRAY['AFP', 'FP'], 8, ARRAY['노후설계', '연금분석'],
    '연금 및 노후설계 전문가로 개인별 맞춤 은퇴 계획을 수립해드립니다.',
    25000, ARRAY['text', 'voice'], true, 'active'
);

-- 샘플 커뮤니티 게시글
INSERT INTO community_posts (
    user_hash, title, content, category, asset_badge, age_badge, region_badge
) VALUES 
(
    'user_001_hash', '60세 은퇴 준비 질문드립니다',
    '3억 정도 모은 상태에서 60세에 은퇴하려고 하는데, 충분할까요? 비슷한 분들의 경험이 궁금합니다.',
    'retirement', '1-3억', '60대', '서울'
),
(
    'user_002_hash', '의료비 지출이 너무 걱정됩니다',
    '건강이 안 좋아지면서 의료비가 늘고 있어요. 노후 의료비는 얼마나 준비해야 할까요?',
    'health', '1억미만', '70대', '경기'
),
(
    'user_003_hash', '자녀에게 부담주기 싫어서...',
    '자녀들이 경제적으로 어려운 상황인데, 부모인 저희가 도움이 되고 싶습니다. 어떻게 해야 할까요?',
    'life', '3-5억', '60대', '부산'
);

COMMIT;
```

### 2.3 실행 확인
1. SQL 코드를 붙여넣은 후 "Run" 버튼 클릭
2. 성공 메시지 확인: "Success. No rows returned"
3. 좌측 메뉴 → "Table Editor"에서 생성된 테이블들 확인

## 🔑 3단계: API 키 및 연결 정보 확인

### 3.1 프로젝트 정보 확인
1. 좌측 메뉴 → "Settings" → "API" 클릭
2. 다음 정보들을 **안전한 곳에 기록**하세요:

```javascript
// 프론트엔드에서 사용할 환경변수들
const supabaseConfig = {
  // Project URL (공개 가능)
  SUPABASE_URL: "https://your-project-id.supabase.co",
  
  // anon/public API Key (공개 가능, 프론트엔드용)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  
  // service_role API Key (비밀, 백엔드 관리용만 사용)
  SUPABASE_SERVICE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
```

**⚠️ 보안 주의사항:**
- `SUPABASE_ANON_KEY`: 프론트엔드에서 사용, 공개 가능
- `SUPABASE_SERVICE_KEY`: 절대 프론트엔드에 노출하면 안됨!

### 3.2 연결 테스트
브라우저 개발자 도구 콘솔에서 테스트:

```javascript
// Supabase 클라이언트 라이브러리 로드 (CDN)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabaseUrl = 'your-project-url'
const supabaseKey = 'your-anon-key'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// 연결 테스트 - 전문가 목록 조회
supabase
  .from('financial_experts')
  .select('name, specializations')
  .then(({ data, error }) => {
    if (error) console.error('연결 실패:', error)
    else console.log('연결 성공:', data)
  })
```

## 🔧 4단계: 프로젝트 코드 연동

### 4.1 환경변수 설정
프로젝트 루트에 `.env.local` 파일 생성:

```bash
# .env.local (Git에 커밋하지 마세요!)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Supabase 클라이언트 설정
`src/services/supabase.js` 파일 생성:

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 헬퍼 함수들
export const supabaseHelpers = {
  // 계산 결과 저장
  async saveCalculation(calculationData) {
    const { data, error } = await supabase
      .from('user_calculations')
      .insert([calculationData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 또래 비교 데이터 조회
  async getAgeGroupStats(ageGroup, assetRange) {
    const { data, error } = await supabase
      .from('user_calculations')
      .select('financial_assets, calculation_result')
      .eq('age_group', ageGroup)
      .gte('financial_assets', assetRange.min)
      .lte('financial_assets', assetRange.max)
    
    if (error) throw error
    return data
  },

  // 전문가 목록 조회
  async getExperts(specialization = null) {
    let query = supabase
      .from('financial_experts')
      .select('*')
      .eq('status', 'active')
      .eq('is_verified', true)
    
    if (specialization) {
      query = query.contains('specializations', [specialization])
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // 커뮤니티 게시글 조회
  async getCommunityPosts(category = null, limit = 20) {
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        community_replies(count)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  }
}
```

### 4.3 패키지 설치
```bash
npm install @supabase/supabase-js
```

## 📊 5단계: 데이터 사용 예시

### 5.1 계산기 결과 저장
```javascript
// 계산기에서 결과 저장
import { supabaseHelpers } from '../services/supabase'

const saveCalculationResult = async (formData, calculationResult) => {
  try {
    const calculationData = {
      age: formData.age,
      age_group: formData.age >= 60 ? '60대' : '50대',
      health_status: formData.health,
      life_mode: formData.mode,
      housing_type: formData.housingType,
      financial_assets: formData.financialAssets * 10000,
      severance_pay: formData.severancePay * 10000,
      debt: formData.debt * 10000,
      national_pension: formData.nationalPension * 10000,
      private_pension: formData.privatePension * 10000,
      calculation_result: calculationResult
    }
    
    const saved = await supabaseHelpers.saveCalculation(calculationData)
    console.log('계산 결과 저장 성공:', saved.id)
    return saved
  } catch (error) {
    console.error('저장 실패:', error)
  }
}
```

### 5.2 또래 비교 데이터 조회
```javascript
// 또래 비교 기능
const getAgeGroupComparison = async (userAge, userAssets) => {
  try {
    const ageGroup = userAge >= 60 ? '60대' : '50대'
    const assetRange = {
      min: userAssets * 0.7,
      max: userAssets * 1.3
    }
    
    const peers = await supabaseHelpers.getAgeGroupStats(ageGroup, assetRange)
    
    // 통계 계산
    const avgAssets = peers.reduce((sum, p) => sum + p.financial_assets, 0) / peers.length
    const avgMonthlyExpense = peers.reduce((sum, p) => 
      sum + (p.calculation_result?.monthlyAmount || 0), 0) / peers.length
    
    return {
      totalCount: peers.length,
      avgAssets: Math.round(avgAssets),
      avgMonthlyExpense: Math.round(avgMonthlyExpense),
      percentile: calculatePercentile(userAssets, peers.map(p => p.financial_assets))
    }
  } catch (error) {
    console.error('또래 비교 조회 실패:', error)
    return null
  }
}
```

### 5.3 커뮤니티 게시글 작성
```javascript
// 커뮤니티 게시글 작성
const createCommunityPost = async (postData, userAssets, userAge) => {
  try {
    const postWithBadges = {
      ...postData,
      user_hash: generateUserHash(), // 익명 식별자 생성
      asset_badge: getAssetBadge(userAssets),
      age_badge: userAge >= 60 ? '60대' : '50대',
      region_badge: '서울' // 실제로는 IP 기반 또는 사용자 입력
    }
    
    const { data, error } = await supabase
      .from('community_posts')
      .insert([postWithBadges])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('게시글 작성 실패:', error)
  }
}
```

## 🔒 6단계: 보안 설정

### 6.1 RLS 정책 확인
SQL Editor에서 다음 쿼리로 정책 확인:

```sql
-- 현재 설정된 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 6.2 익명 사용자 설정
Supabase는 기본적으로 익명 사용자를 지원합니다:

```javascript
// 익명 사용자 식별자 생성 (브라우저 로컬스토리지 기반)
const generateUserHash = () => {
  let userHash = localStorage.getItem('planb_user_hash')
  if (!userHash) {
    userHash = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('planb_user_hash', userHash)
  }
  return userHash
}
```

## 📈 7단계: 모니터링 및 관리

### 7.1 대시보드 확인
- **Database** → **Table Editor**: 데이터 직접 확인/편집
- **Auth** → **Users**: 사용자 관리 (현재는 익명 사용)
- **Storage**: 파일 업로드 (전문가 프로필 사진 등)
- **Logs**: 에러 및 성능 로그 확인

### 7.2 사용량 모니터링
- **Settings** → **Usage**: 월간 사용량 확인
- **Free Tier 한도**:
  - 데이터베이스: 500MB
  - API 요청: 월 500만회
  - 스토리지: 1GB
  - 대역폭: 5GB

### 7.3 백업 설정
- **Database** → **Backups**에서 자동 백업 확인
- Free 티어: 일일 백업 7일 보관
- 필요시 수동 백업 생성 가능

## 🚨 트러블슈팅

### 자주 발생하는 문제들

#### 1. 연결 실패 (Connection Error)
```
error: Failed to fetch
```
**해결방법:**
- SUPABASE_URL이 올바른지 확인
- API 키가 올바른지 확인
- 브라우저 CORS 설정 확인

#### 2. RLS 정책으로 인한 접근 거부
```
error: new row violates row-level security policy
```
**해결방법:**
- SQL Editor에서 해당 테이블의 RLS 정책 확인
- 익명 사용자 정책이 올바른지 확인

#### 3. 데이터 타입 불일치
```
error: invalid input syntax for type uuid
```
**해결방법:**
- UUID는 자동 생성되므로 INSERT 시 포함하지 않기
- 날짜는 ISO 8601 형식 사용

#### 4. API 요청 한도 초과
```
error: API rate limit exceeded
```
**해결방법:**
- 요청 빈도 줄이기
- Pro 플랜 업그레이드 검토

## 💰 8단계: 비용 관리

### Free Tier 최적화 팁
1. **불필요한 인덱스 제거**: 성능은 떨어지지만 용량 절약
2. **정기적인 데이터 정리**: 오래된 테스트 데이터 삭제
3. **JSON 활용**: 관련 데이터를 JSONB로 저장하여 테이블 수 줄이기
4. **CDN 활용**: 이미지는 외부 CDN 사용

### Pro 플랜 업그레이드 시점
- 월 사용자 500명 초과시
- 데이터베이스 용량 400MB 초과시
- 실시간 기능 본격 사용시
- **비용**: $25/월 (훨씬 관대한 한도)

## ✅ 설정 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 스키마 구축 완료 (7개 테이블)
- [ ] API 키 및 URL 확인 완료
- [ ] 환경변수 설정 완료
- [ ] 프로젝트 코드 연동 완료
- [ ] 연결 테스트 성공
- [ ] RLS 정책 확인 완료
- [ ] 샘플 데이터 확인 완료

## 🔗 유용한 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트 가이드](https://supabase.com/docs/reference/javascript)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 도움이 필요하면

1. **Supabase 공식 Discord**: [discord.gg/supabase](https://discord.gg/supabase)
2. **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
3. **Stack Overflow**: `supabase` 태그로 검색

---

## 📝 다음 단계

이 가이드를 완료하면 다음과 같은 작업이 가능합니다:

1. **계산기 데이터 저장**: 사용자 계산 결과를 데이터베이스에 저장
2. **또래 비교 기능**: 실제 사용자 데이터 기반 통계 제공
3. **커뮤니티 기능**: 익명 게시판 및 댓글 시스템
4. **전문가 상담**: 전문가 프로필 및 상담 예약 시스템
5. **실시간 기능**: 실시간 채팅 및 알림 (추후 구현)

성공적인 설정을 위해 단계별로 차근차근 진행하시고, 문제가 발생하면 트러블슈팅 섹션을 참고하세요!