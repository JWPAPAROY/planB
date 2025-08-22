// Supabase 설정 - 환경변수로 관리
export const supabaseConfig = {
  url: process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'
};

// 브라우저 환경에서 직접 설정 (실제 프로덕션에서는 환경변수 사용)
export const devSupabaseConfig = {
  // 실제 Supabase 프로젝트 URL과 키로 교체 필요
  url: 'YOUR_SUPABASE_PROJECT_URL', 
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// 브라우저 환경을 위한 설정 (환경변수가 없을 때)
export const getBrowserSupabaseConfig = () => {
  // 실제 사용시에는 이 값들을 실제 Supabase 프로젝트 정보로 교체
  return {
    url: window.SUPABASE_URL || devSupabaseConfig.url,
    anonKey: window.SUPABASE_ANON_KEY || devSupabaseConfig.anonKey
  };
};

// Supabase 테이블 이름들 (SQL 스키마와 일치)
export const TABLES = {
  USER_CALCULATIONS: 'user_calculations',
  USER_EXPENSES: 'user_expenses', 
  COMMUNITY_POSTS: 'community_posts',
  COMMUNITY_REPLIES: 'community_replies',
  FINANCIAL_EXPERTS: 'financial_experts',
  CONSULTATION_SESSIONS: 'consultation_sessions',
  CONSULTATION_REVIEWS: 'consultation_reviews'
};

// 브라우저 환경에서 Supabase 라이브러리 로드 확인
export const checkSupabaseAvailability = () => {
  if (typeof window === 'undefined') {
    console.warn('브라우저 환경이 아닙니다.');
    return false;
  }
  
  if (typeof window.createClient === 'undefined') {
    console.warn('Supabase 라이브러리가 로드되지 않았습니다. CDN을 확인하세요.');
    return false;
  }
  
  return true;
};

// SQL 스키마와 매핑하는 필드 정의
export const FIELD_MAPPINGS = {
  user_calculations: {
    userHash: 'user_hash',
    ageGroup: 'age_group',
    healthStatus: 'health_status',
    lifeMode: 'life_mode',
    housingType: 'housing_type',
    housingValue: 'housing_value',
    financialAssets: 'financial_assets',
    severancePay: 'severance_pay',
    nationalPension: 'national_pension',
    privatePension: 'private_pension',
    calculationResult: 'calculation_result',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  user_expenses: {
    calculationId: 'calculation_id',
    foodExpenses: 'food_expenses',
    communicationExpenses: 'communication_expenses',
    utilitiesExpenses: 'utilities_expenses',
    livingExpenses: 'living_expenses',
    medicalExpenses: 'medical_expenses',
    hobbyExpenses: 'hobby_expenses',
    totalMonthlyExpenses: 'total_monthly_expenses'
  }
};

// RLS 정책 설정을 위한 스키마 (참조용)
export const DATABASE_SCHEMA = {
  // 사용자 계산 데이터 (익명)
  user_calculations: `
    CREATE TABLE user_calculations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      age_group TEXT,
      asset_level TEXT,
      housing_type TEXT,
      calculation_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // 지출 내역 (또래 비교용)
  user_expenses: `
    CREATE TABLE user_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      calculation_id UUID REFERENCES user_calculations(id),
      food INTEGER,
      communication INTEGER,
      utilities INTEGER,
      living INTEGER,
      medical INTEGER,
      hobby INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // 전문가 프로필
  financial_experts: `
    CREATE TABLE financial_experts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      credentials TEXT[],
      experience_years INTEGER,
      specializations TEXT[],
      introduction TEXT,
      hourly_rate INTEGER,
      rating_average DECIMAL(3,2),
      total_consultations INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // 상담 세션
  consultation_sessions: `
    CREATE TABLE consultation_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_calculation_id UUID REFERENCES user_calculations(id),
      expert_id UUID REFERENCES financial_experts(id),
      user_hash TEXT,
      status TEXT DEFAULT 'pending',
      consultation_type TEXT,
      scheduled_at TIMESTAMP WITH TIME ZONE,
      duration_minutes INTEGER DEFAULT 60,
      price_paid INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // 상담 평가 및 후기
  consultation_reviews: `
    CREATE TABLE consultation_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES consultation_sessions(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT,
      expert_response TEXT,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
};

// 유틸리티 함수들
export const generateUserHash = () => {
  // 브라우저 기반 익명 식별자 생성
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `user_${random}_${timestamp}`;
};

export const getAgeGroup = (age) => {
  if (age < 50) return '50미만';
  if (age >= 50 && age < 60) return '50대';
  if (age >= 60 && age < 70) return '60대';
  if (age >= 70 && age < 80) return '70대';
  return '80세이상';
};

export const getAssetBadge = (totalAssets) => {
  const assets = parseInt(totalAssets) || 0;
  if (assets < 100000000) return '1억미만';
  if (assets >= 100000000 && assets < 300000000) return '1-3억';
  if (assets >= 300000000 && assets < 500000000) return '3-5억';
  if (assets >= 500000000 && assets < 1000000000) return '5-10억';
  return '10억이상';
};