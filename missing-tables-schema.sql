-- 플랜비 누락된 테이블 스키마
-- 실행 방법: Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행

-- 1. 익명 세션 관리 테이블
CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash TEXT UNIQUE NOT NULL,
  user_data JSONB,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 실시간 채팅방 테이블  
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL, -- 'private', 'group', 'expert'
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 실시간 채팅 메시지 테이블
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT, -- 익명 사용자용
  
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  content TEXT NOT NULL,
  file_url TEXT, -- 파일 첨부시
  file_name TEXT,
  file_size INTEGER,
  
  reply_to_id UUID REFERENCES chat_messages(id), -- 답글 기능
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- 4. 채팅방 참여자 테이블
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT, -- 익명 사용자용
  
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 5. 공지사항 테이블
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'general', 'maintenance', 'feature', 'important'
  
  -- 대상 설정
  target_audience TEXT DEFAULT 'all', -- 'all', 'members', 'experts', 'admin'
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- 표시 설정
  show_on_login BOOLEAN DEFAULT FALSE,
  show_on_main BOOLEAN DEFAULT TRUE,
  display_start_date TIMESTAMP WITH TIME ZONE,
  display_end_date TIMESTAMP WITH TIME ZONE,
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- 높을수록 먼저 표시
  
  -- 메타 정보
  created_by UUID REFERENCES user_profiles(id),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 공지사항 조회 기록 테이블
CREATE TABLE announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  user_hash TEXT, -- 익명 사용자용
  
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(announcement_id, user_id),
  UNIQUE(announcement_id, user_hash)
);

-- 7. 전문가 전용 게시글 테이블
CREATE TABLE expert_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES financial_experts(id),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'tip', 'analysis', 'news', 'qa'
  tags TEXT[], -- ["은퇴설계", "자산배분", "세금절약"]
  
  -- 전문가 인사이트
  expertise_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'  
  reading_time INTEGER, -- 예상 읽기 시간(분)
  
  -- 상호작용
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  
  -- 상태
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 수수료 정산 테이블
CREATE TABLE fee_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES financial_experts(id),
  
  -- 정산 기간
  settlement_period_start DATE NOT NULL,
  settlement_period_end DATE NOT NULL,
  
  -- 금액 정보
  total_consultation_amount INTEGER NOT NULL, -- 총 상담료
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.1000, -- 플랫폼 수수료율 (10%)
  platform_fee_amount INTEGER NOT NULL, -- 플랫폼 수수료
  expert_settlement_amount INTEGER NOT NULL, -- 전문가 정산액
  
  -- 세금 정보
  tax_withholding_amount INTEGER DEFAULT 0, -- 원천징수세
  final_payment_amount INTEGER NOT NULL, -- 최종 지급액
  
  -- 정산 상태
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  
  -- 결제 정보
  bank_name TEXT,
  bank_account TEXT,
  account_holder TEXT,
  payment_date DATE,
  
  -- 세부 내역 (JSON)
  settlement_details JSONB, -- 상담 세션별 상세 내역
  
  -- 메타 정보
  created_by UUID REFERENCES user_profiles(id), -- 관리자
  approved_by UUID REFERENCES user_profiles(id), -- 승인자
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 연락처 교환 요청 테이블
CREATE TABLE contact_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES user_profiles(id),
  expert_id UUID REFERENCES financial_experts(id),
  
  -- 요청 정보
  request_message TEXT,
  consultation_topic TEXT,
  preferred_contact_method TEXT, -- 'phone', 'email', 'kakao'
  
  -- 상태 관리
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  
  -- 응답 정보
  expert_response TEXT,
  expert_contact_info JSONB, -- 승인시 연락처 정보
  
  -- 만료 관리
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_anonymous_sessions_hash ON anonymous_sessions(session_hash);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_participants_room_user ON chat_participants(room_id, user_id);
CREATE INDEX idx_announcements_active ON announcements(is_active, priority DESC);
CREATE INDEX idx_announcement_views_user ON announcement_views(user_id);
CREATE INDEX idx_expert_posts_published ON expert_posts(is_published, published_at DESC);
CREATE INDEX idx_fee_settlements_expert ON fee_settlements(expert_id, settlement_period_end DESC);
CREATE INDEX idx_contact_requests_status ON contact_exchange_requests(status, created_at DESC);

-- RLS (Row Level Security) 활성화 
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_exchange_requests ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책들 (3순위에서 상세 설정)
-- 익명 세션: 세션 해시로만 접근
CREATE POLICY "Anonymous sessions access" ON anonymous_sessions FOR ALL USING (true);

-- 공지사항: 모든 사용자 읽기 가능
CREATE POLICY "Announcements public read" ON announcements FOR SELECT USING (is_active = true);

-- 전문가 게시글: 발행된 글만 읽기 가능  
CREATE POLICY "Expert posts public read" ON expert_posts FOR SELECT USING (is_published = true);

-- 수수료 정산: 해당 전문가와 관리자만 접근
CREATE POLICY "Fee settlements expert access" ON fee_settlements FOR ALL USING (
  expert_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 연락처 교환: 요청자와 해당 전문가만 접근
CREATE POLICY "Contact requests user access" ON contact_exchange_requests FOR ALL USING (
  requester_id = auth.uid() OR expert_id = auth.uid()
);

-- 완료 메시지
SELECT 'Missing tables schema created successfully!' as result;