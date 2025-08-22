-- 플랜비 전문가 플랫폼 데이터베이스 스키마
-- 2025년 8월 22일 생성

-- 1. 전문가 프로필 테이블
CREATE TABLE expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_type TEXT CHECK (expert_type IN ('travel', 'legal', 'living')) NOT NULL,
  
  -- 기본 정보
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  bio TEXT,
  profile_image TEXT,
  
  -- 전문 분야
  specialties TEXT[] NOT NULL,
  credentials TEXT[], -- 자격증 리스트
  
  -- 상담 정보
  hourly_rate INTEGER NOT NULL, -- 시간당 요금 (원)
  consultation_duration INTEGER DEFAULT 60, -- 기본 상담 시간 (분)
  available_times JSONB, -- 상담 가능 시간대
  
  -- 플랫폼 정보
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  total_consultations INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 전문가 게시글 테이블
CREATE TABLE expert_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- 게시글 정보
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  service_description TEXT, -- 제공 서비스 설명
  category TEXT CHECK (category IN ('travel', 'legal', 'living')) NOT NULL,
  
  -- 상담 관련 정보
  consultation_type TEXT[] NOT NULL, -- ['phone', 'video', 'chat']
  price_info TEXT, -- 상담료 안내
  sample_questions TEXT[], -- 예시 질문들
  
  -- 메타 정보
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 상담 예약 테이블
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  client_user_hash TEXT NOT NULL, -- 고객 해시 (기존 시스템과 연동)
  
  -- 예약 정보
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  consultation_type TEXT CHECK (consultation_type IN ('phone', 'video', 'chat')) NOT NULL,
  
  -- 상담 내용
  consultation_topic TEXT NOT NULL,
  client_questions TEXT,
  expert_notes TEXT,
  
  -- 연결 정보
  meeting_link TEXT, -- Zoom, Meet 등 링크
  phone_number TEXT,
  
  -- 상태 관리
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'disputed')) DEFAULT 'pending',
  expert_confirmed BOOLEAN DEFAULT false,
  client_confirmed BOOLEAN DEFAULT false,
  
  -- 정산 관련
  payment_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  expert_payout INTEGER NOT NULL,
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'completed')) DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 상담 후기 테이블
CREATE TABLE consultation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  
  -- 후기 내용
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_title TEXT,
  review_content TEXT,
  
  -- 세부 평가
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- 추천 여부
  would_recommend BOOLEAN,
  is_anonymous BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 전문가 인증 문서 테이블
CREATE TABLE expert_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- 인증 정보
  credential_type TEXT NOT NULL, -- '자격증', '학위', '경력증명' 등
  credential_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_number TEXT,
  
  -- 파일 정보
  document_url TEXT, -- 인증서 이미지/파일 URL
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 전문가 상담 가능 시간 테이블
CREATE TABLE expert_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- 시간 정보
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=일요일
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 특별 설정
  is_active BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'Asia/Seoul',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 전문가 게시글 좋아요 테이블
CREATE TABLE expert_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES expert_posts(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, user_hash)
);

-- 인덱스 생성
CREATE INDEX idx_expert_profiles_user_id ON expert_profiles(user_id);
CREATE INDEX idx_expert_profiles_type ON expert_profiles(expert_type);
CREATE INDEX idx_expert_profiles_verified ON expert_profiles(is_verified, is_active);

CREATE INDEX idx_expert_posts_expert_id ON expert_posts(expert_id);
CREATE INDEX idx_expert_posts_category ON expert_posts(category);
CREATE INDEX idx_expert_posts_featured ON expert_posts(is_featured);

CREATE INDEX idx_consultations_expert_id ON consultations(expert_id);
CREATE INDEX idx_consultations_client ON consultations(client_user_hash);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_scheduled_time ON consultations(scheduled_time);

CREATE INDEX idx_consultation_reviews_consultation_id ON consultation_reviews(consultation_id);
CREATE INDEX idx_consultation_reviews_rating ON consultation_reviews(rating);

CREATE INDEX idx_expert_credentials_expert_id ON expert_credentials(expert_id);
CREATE INDEX idx_expert_credentials_status ON expert_credentials(verification_status);

CREATE INDEX idx_expert_availability_expert_id ON expert_availability(expert_id);
CREATE INDEX idx_expert_availability_day ON expert_availability(day_of_week, is_active);

-- Row Level Security (RLS) 정책
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_post_likes ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (읽기는 모든 사용자, 쓰기는 소유자만)
CREATE POLICY "Public read access" ON expert_profiles FOR SELECT USING (is_active = true AND is_verified = true);
CREATE POLICY "Expert write access" ON expert_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read access" ON expert_posts FOR SELECT USING (true);
CREATE POLICY "Expert write access" ON expert_posts FOR ALL USING (
  expert_id IN (SELECT id FROM expert_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Consultation access" ON consultations FOR ALL USING (
  expert_id IN (SELECT id FROM expert_profiles WHERE user_id = auth.uid())
  OR client_user_hash = current_setting('app.current_user_hash', true)
);

-- 트리거 함수들
CREATE OR REPLACE FUNCTION update_expert_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 전문가 통계 업데이트
  UPDATE expert_profiles 
  SET 
    total_consultations = (
      SELECT COUNT(*) 
      FROM consultations 
      WHERE expert_id = NEW.expert_id AND status = 'completed'
    ),
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM consultation_reviews cr
      JOIN consultations c ON cr.consultation_id = c.id
      WHERE c.expert_id = NEW.expert_id
    ),
    updated_at = NOW()
  WHERE id = NEW.expert_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_expert_stats_trigger
  AFTER INSERT OR UPDATE ON consultation_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_stats();

CREATE TRIGGER update_expert_stats_consultation_trigger
  AFTER UPDATE ON consultations
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_expert_stats();