-- 플랜비 완전한 데이터베이스 스키마
-- 실행 방법: 이 파일을 먼저 실행하여 모든 테이블을 생성

-- ================================
-- 기존 테이블들 (누락된 컬럼 포함하여 재생성)
-- ================================

-- 기존 테이블들이 있다면 삭제하고 재생성 (주의: 데이터 삭제됨)
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS user_calculations CASCADE; 
-- DROP TABLE IF EXISTS user_expenses CASCADE;
-- DROP TABLE IF EXISTS community_posts CASCADE;
-- DROP TABLE IF EXISTS community_replies CASCADE;
-- DROP TABLE IF EXISTS financial_experts CASCADE;
-- DROP TABLE IF EXISTS consultation_sessions CASCADE;
-- DROP TABLE IF EXISTS consultation_reviews CASCADE;

-- 1. 사용자 프로필 테이블 (완전한 버전)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  nickname TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'member', -- 'member', 'expert', 'admin'
  is_verified BOOLEAN DEFAULT FALSE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 계산 데이터 테이블 (완전한 버전)
CREATE TABLE IF NOT EXISTS user_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT, -- 익명 식별자
  
  -- 기본 정보
  age INTEGER,
  age_group TEXT,
  health_status TEXT,
  life_mode TEXT,
  
  -- 자산 정보
  housing_type TEXT,
  housing_value BIGINT,
  financial_assets BIGINT,
  severance_pay BIGINT,
  debt BIGINT,
  
  -- 연금 정보
  national_pension BIGINT,
  private_pension BIGINT,
  
  -- 계산 결과
  calculation_result JSONB,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 지출 내역 테이블 (완전한 버전)
CREATE TABLE IF NOT EXISTS user_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES user_calculations(id) ON DELETE CASCADE,
  
  -- 지출 카테고리
  food_expenses INTEGER,
  communication_expenses INTEGER,
  utilities_expenses INTEGER,
  living_expenses INTEGER,
  medical_expenses INTEGER,
  leisure_expenses INTEGER,
  transportation_expenses INTEGER,
  miscellaneous_expenses INTEGER,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 커뮤니티 게시글 테이블 (완전한 버전)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT, -- 익명 사용자용
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- 익명 뱃지 정보
  asset_badge TEXT,
  age_badge TEXT,
  region_badge TEXT,
  
  -- 상호작용
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 커뮤니티 댓글 테이블 (완전한 버전)
CREATE TABLE IF NOT EXISTS community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT,
  
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES community_replies(id),
  
  -- 상호작용
  likes INTEGER DEFAULT 0,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 전문가 프로필 테이블 (financial_experts)
CREATE TABLE IF NOT EXISTS financial_experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- 자격 및 경력
  credentials TEXT[],
  experience_years INTEGER NOT NULL,
  specializations TEXT[],
  career_summary TEXT,
  introduction TEXT,
  
  -- 상담 정보
  hourly_rate INTEGER NOT NULL,
  available_times JSONB,
  consultation_types TEXT[],
  
  -- 평가 및 통계
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  total_consultations INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- 계정 상태
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB,
  status TEXT DEFAULT 'pending',
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 상담 세션 테이블 (consultation_sessions)
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_calculation_id UUID REFERENCES user_calculations(id),
  expert_id UUID REFERENCES financial_experts(id),
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT,
  
  -- 상담 정보
  consultation_type TEXT NOT NULL,
  session_title TEXT,
  user_questions TEXT,
  
  -- 스케줄링
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- 결제 정보
  price_paid INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  
  -- 상담 상태
  status TEXT DEFAULT 'pending',
  cancellation_reason TEXT,
  
  -- 상담 결과
  session_notes TEXT,
  expert_summary TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 상담 리뷰 테이블
CREATE TABLE IF NOT EXISTS consultation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES consultation_sessions(id),
  user_id UUID REFERENCES user_profiles(id),
  expert_id UUID REFERENCES financial_experts(id),
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- 세부 평가
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- 추천 여부
  would_recommend BOOLEAN,
  
  -- 메타 정보
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 새로운 테이블들 (missing-tables-schema.sql 내용 통합)
-- ================================

-- 9. 익명 세션 관리 테이블
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash TEXT UNIQUE NOT NULL,
  user_data JSONB,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 실시간 채팅방 테이블  
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 실시간 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT,
  
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  
  reply_to_id UUID REFERENCES chat_messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- 12. 채팅방 참여자 테이블
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT,
  
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 13. 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  
  target_audience TEXT DEFAULT 'all',
  is_pinned BOOLEAN DEFAULT FALSE,
  
  show_on_login BOOLEAN DEFAULT FALSE,
  show_on_main BOOLEAN DEFAULT TRUE,
  display_start_date TIMESTAMP WITH TIME ZONE,
  display_end_date TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES user_profiles(id),
  views_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 공지사항 조회 기록 테이블
CREATE TABLE IF NOT EXISTS announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT,
  
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 전문가 전용 게시글 테이블
CREATE TABLE IF NOT EXISTS expert_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES financial_experts(id),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  
  expertise_level TEXT DEFAULT 'intermediate',
  reading_time INTEGER,
  
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. 수수료 정산 테이블
CREATE TABLE IF NOT EXISTS fee_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES financial_experts(id),
  
  settlement_period_start DATE NOT NULL,
  settlement_period_end DATE NOT NULL,
  
  total_consultation_amount INTEGER NOT NULL,
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.1000,
  platform_fee_amount INTEGER NOT NULL,
  expert_settlement_amount INTEGER NOT NULL,
  
  tax_withholding_amount INTEGER DEFAULT 0,
  final_payment_amount INTEGER NOT NULL,
  
  status TEXT DEFAULT 'pending',
  
  bank_name TEXT,
  bank_account TEXT,
  account_holder TEXT,
  payment_date DATE,
  
  settlement_details JSONB,
  
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. 연락처 교환 요청 테이블
CREATE TABLE IF NOT EXISTS contact_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES user_profiles(id),
  expert_id UUID REFERENCES financial_experts(id),
  
  request_message TEXT,
  consultation_topic TEXT,
  preferred_contact_method TEXT,
  
  status TEXT DEFAULT 'pending',
  
  expert_response TEXT,
  expert_contact_info JSONB,
  
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 인덱스 생성
-- ================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_calculations_hash ON user_calculations(user_hash);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_experts_status ON financial_experts(status, is_verified);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_expert ON consultation_sessions(expert_id, status);

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_hash ON anonymous_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user ON chat_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_expert_posts_published ON expert_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_settlements_expert ON fee_settlements(expert_id, settlement_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_exchange_requests(status, created_at DESC);

-- ================================
-- Storage 버킷 생성
-- ================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('chat-files', 'chat-files', false),
  ('expert-documents', 'expert-documents', false),
  ('profile-images', 'profile-images', false)
ON CONFLICT (id) DO NOTHING;

-- 완료 메시지
SELECT 'Complete database schema created successfully! Total tables: 17' as result;