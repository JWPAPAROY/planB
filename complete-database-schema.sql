-- ================================
-- 플랜비 완전한 데이터베이스 스키마
-- 생성일: 2025-08-27
-- 버전: 2.0 (전문가 상담 시스템 포함)
-- ================================

-- 모든 extension 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- 1. 사용자 관리 테이블
-- ================================

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT UNIQUE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'expert', 'admin', 'super_admin')),
    age_range TEXT CHECK (age_range IN ('20s', '30s', '40s', '50s', '60s', '70s')),
    phone TEXT,
    profile_image TEXT,
    expert_status TEXT DEFAULT NULL CHECK (expert_status IN ('pending', 'approved', 'rejected', 'inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false
);

-- 익명/게스트 세션 테이블  
CREATE TABLE anonymous_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_hash TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    calculation_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    is_migrated BOOLEAN DEFAULT false,
    migrated_to_user_id UUID REFERENCES user_profiles(id)
);

-- ================================
-- 2. 계산기 시스템 테이블
-- ================================

-- 사용자 계산 결과 테이블
CREATE TABLE user_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES user_profiles(id),
    user_hash TEXT, -- 게스트용
    calculation_type TEXT DEFAULT 'retirement' CHECK (calculation_type IN ('retirement', 'investment', 'insurance')),
    form_data JSONB NOT NULL,
    calculation_result JSONB NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- 사용자 지출 항목 테이블
CREATE TABLE user_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES user_profiles(id),
    user_hash TEXT, -- 게스트용  
    calculation_id UUID REFERENCES user_calculations(id),
    category TEXT NOT NULL,
    subcategory TEXT,
    amount INTEGER NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    frequency TEXT CHECK (frequency IN ('monthly', 'yearly', 'one_time'))
);

-- ================================
-- 3. 커뮤니티 시스템 테이블  
-- ================================

-- 커뮤니티 게시글 테이블
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    user_hash TEXT NOT NULL, -- 익명 표시용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT NOT NULL CHECK (topic IN ('retirement', 'investment', 'lifestyle', 'health', 'free', 'expert')),
    lifestyle_badge TEXT CHECK (lifestyle_badge IN ('prudent', 'balanced', 'premium')),
    region_badge TEXT,
    age_badge TEXT CHECK (age_badge IN ('20s', '30s', '40s', '50s', '60s', '70s')),
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    expert_name TEXT, -- 전문가 게시글용
    expert_title TEXT, -- 전문가 게시글용  
    consultation_price TEXT, -- 전문가 게시글용
    is_deleted BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false
);

-- 커뮤니티 댓글 테이블
CREATE TABLE community_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_id UUID REFERENCES community_posts(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    user_hash TEXT NOT NULL,
    parent_id UUID REFERENCES community_replies(id), -- 대댓글용
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false
);

-- ================================
-- 4. 전문가 시스템 테이블
-- ================================

-- 전문가 프로필 테이블
CREATE TABLE financial_experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES user_profiles(id) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    specialties TEXT[] NOT NULL,
    credentials TEXT[] NOT NULL,
    experience_years INTEGER NOT NULL,
    hourly_rate INTEGER NOT NULL,
    available_types TEXT[] DEFAULT ARRAY['phone', 'video', 'chat'],
    phone TEXT,
    email TEXT,
    business_license TEXT,
    qualification_number TEXT,
    profile_image TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    response_rate INTEGER DEFAULT 100,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES user_profiles(id),
    rejection_reason TEXT
);

-- 전문가 서비스 게시글 테이블
CREATE TABLE expert_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expert_id UUID REFERENCES financial_experts(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    service_type TEXT NOT NULL,
    consultation_price INTEGER NOT NULL,
    available_types TEXT[] DEFAULT ARRAY['phone', 'video'],
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0
);

-- ================================
-- 5. 상담 시스템 테이블
-- ================================

-- 상담 세션 테이블
CREATE TABLE consultation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expert_id UUID REFERENCES financial_experts(id) NOT NULL,
    client_id UUID REFERENCES user_profiles(id) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    consultation_type TEXT NOT NULL CHECK (consultation_type IN ('phone', 'video', 'chat')),
    consultation_topic TEXT NOT NULL,
    client_questions TEXT,
    payment_amount INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    expert_payout INTEGER NOT NULL,
    payment_method TEXT,
    payment_id TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    notes TEXT
);

-- 상담 메시지 테이블 (전문가-고객 채팅)
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consultation_id UUID REFERENCES consultation_sessions(id) NOT NULL,
    sender_id UUID REFERENCES user_profiles(id) NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('expert', 'client')),
    message_text TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_deleted BOOLEAN DEFAULT false
);

-- 상담 후기 테이블
CREATE TABLE consultation_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consultation_id UUID REFERENCES consultation_sessions(id) UNIQUE NOT NULL,
    expert_id UUID REFERENCES financial_experts(id) NOT NULL,
    client_id UUID REFERENCES user_profiles(id) NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    review_title TEXT,
    review_content TEXT,
    would_recommend BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false
);

-- ================================
-- 6. 실시간 채팅 테이블
-- ================================

-- 채팅방 테이블
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'expert', 'consultation')),
    max_participants INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id),
    consultation_id UUID REFERENCES consultation_sessions(id) -- 상담용 채팅방
);

-- 채팅방 참가자 테이블
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_moderator BOOLEAN DEFAULT false,
    UNIQUE(room_id, user_id)
);

-- 채팅 메시지 테이블
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    room_id UUID REFERENCES chat_rooms(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    message_text TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    reply_to UUID REFERENCES chat_messages(id),
    is_deleted BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- ================================
-- 7. 공지사항 시스템 테이블
-- ================================

-- 공지사항 테이블
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author_id UUID REFERENCES user_profiles(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN ('general', 'maintenance', 'feature', 'event')),
    is_important BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0
);

-- 공지사항 읽음 상태 테이블
CREATE TABLE announcement_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES announcements(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- ================================
-- 8. 연락처 교환 시스템 테이블
-- ================================

-- 연락처 교환 요청 테이블
CREATE TABLE contact_exchange_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consultation_id UUID REFERENCES consultation_sessions(id) NOT NULL,
    expert_id UUID REFERENCES financial_experts(id) NOT NULL,
    client_id UUID REFERENCES user_profiles(id) NOT NULL,
    expert_approved BOOLEAN DEFAULT false,
    client_approved BOOLEAN DEFAULT false,
    expert_approved_at TIMESTAMP WITH TIME ZONE,
    client_approved_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '48 hours',
    expert_contact_info JSONB, -- {"phone": "010-1234-5678", "email": "expert@example.com"}
    client_contact_info JSONB
);

-- ================================
-- 9. 결제/정산 시스템 테이블 (미래 확장용)
-- ================================

-- 수수료 정산 테이블
CREATE TABLE fee_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expert_id UUID REFERENCES financial_experts(id) NOT NULL,
    settlement_period_start DATE NOT NULL,
    settlement_period_end DATE NOT NULL,
    total_consultation_amount INTEGER NOT NULL,
    platform_fee_amount INTEGER NOT NULL,
    expert_payout_amount INTEGER NOT NULL,
    total_consultations INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT
);

-- ================================
-- 10. 인덱스 생성
-- ================================

-- 사용자 관련 인덱스
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_anonymous_sessions_hash ON anonymous_sessions(session_hash);

-- 계산 관련 인덱스  
CREATE INDEX idx_user_calculations_user_id ON user_calculations(user_id);
CREATE INDEX idx_user_calculations_user_hash ON user_calculations(user_hash);
CREATE INDEX idx_user_calculations_created_at ON user_calculations(created_at DESC);

-- 커뮤니티 관련 인덱스
CREATE INDEX idx_community_posts_topic ON community_posts(topic);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_replies_post_id ON community_replies(post_id);

-- 전문가 관련 인덱스
CREATE INDEX idx_financial_experts_user_id ON financial_experts(user_id);
CREATE INDEX idx_financial_experts_verified ON financial_experts(is_verified, is_active);
CREATE INDEX idx_expert_posts_expert_id ON expert_posts(expert_id);

-- 상담 관련 인덱스
CREATE INDEX idx_consultation_sessions_expert_id ON consultation_sessions(expert_id);
CREATE INDEX idx_consultation_sessions_client_id ON consultation_sessions(client_id);
CREATE INDEX idx_consultation_sessions_scheduled_time ON consultation_sessions(scheduled_time);
CREATE INDEX idx_consultation_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_consultation_reviews_expert_id ON consultation_reviews(expert_id);

-- 채팅 관련 인덱스
CREATE INDEX idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- 공지사항 관련 인덱스
CREATE INDEX idx_announcements_active ON announcements(is_active, published_at DESC);
CREATE INDEX idx_announcement_views_user_id ON announcement_views(user_id);

-- ================================
-- 11. Storage 버킷 생성
-- ================================

-- 프로필 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 채팅 파일 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- 전문가 문서 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-documents', 'expert-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ================================
-- 12. 트리거 함수들
-- ================================

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 updated_at 트리거 적용
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'user_profiles', 'anonymous_sessions', 'user_calculations', 
        'community_posts', 'community_replies', 'financial_experts', 
        'expert_posts', 'consultation_sessions', 'consultation_messages',
        'consultation_reviews', 'chat_rooms', 'chat_participants',
        'chat_messages', 'announcements', 'contact_exchange_requests',
        'fee_settlements'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            CREATE TRIGGER trigger_set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', 
            table_name);
    END LOOP;
END $$;

-- 댓글 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET replies_count = replies_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET replies_count = GREATEST(replies_count - 1, 0) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_replies_count
    AFTER INSERT OR DELETE ON community_replies
    FOR EACH ROW EXECUTE FUNCTION update_post_replies_count();

-- 전문가 리뷰 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_expert_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE financial_experts 
        SET 
            total_reviews = total_reviews + 1,
            average_rating = (
                SELECT ROUND(AVG(overall_rating), 2)
                FROM consultation_reviews 
                WHERE expert_id = NEW.expert_id AND is_deleted = false
            )
        WHERE id = NEW.expert_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE financial_experts 
        SET 
            total_reviews = GREATEST(total_reviews - 1, 0),
            average_rating = COALESCE((
                SELECT ROUND(AVG(overall_rating), 2)
                FROM consultation_reviews 
                WHERE expert_id = OLD.expert_id AND is_deleted = false
            ), 0.0)
        WHERE id = OLD.expert_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expert_review_stats
    AFTER INSERT OR DELETE ON consultation_reviews
    FOR EACH ROW EXECUTE FUNCTION update_expert_review_stats();

-- ================================
-- 13. 유틸리티 함수들
-- ================================

-- 랜덤 닉네임 생성 함수
CREATE OR REPLACE FUNCTION generate_random_nickname()
RETURNS TEXT AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        '지혜로운', '신중한', '적극적인', '차분한', '열정적인', 
        '꼼꼼한', '활발한', '따뜻한', '성실한', '창의적인'
    ];
    nouns TEXT[] := ARRAY[
        '나무', '바람', '구름', '별', '달', 
        '꽃', '바다', '산', '새', '나비'
    ];
    numbers TEXT[] := ARRAY[
        '01', '02', '03', '07', '10', '15', '20', '25', '30', '50'
    ];
    nickname TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        nickname := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] ||
                   nouns[1 + floor(random() * array_length(nouns, 1))::int] ||
                   numbers[1 + floor(random() * array_length(numbers, 1))::int];
        
        -- 중복 검사
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE nickname = nickname) THEN
            RETURN nickname;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            -- 무한 루프 방지: 타임스탬프 추가
            nickname := nickname || extract(epoch from now())::text;
            RETURN nickname;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 사용자 해시 설정 함수 
CREATE OR REPLACE FUNCTION set_current_user_hash(hash_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_hash', hash_value, true);
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 14. 초기 데이터 삽입
-- ================================

-- 기본 채팅방 생성
INSERT INTO chat_rooms (id, name, description, room_type, created_by) VALUES
(uuid_generate_v4(), '전체 채팅', '모든 회원이 참여할 수 있는 공개 채팅방입니다', 'public', NULL),
(uuid_generate_v4(), '전문가 상담실', '전문가와의 상담을 위한 채팅방입니다', 'expert', NULL)
ON CONFLICT DO NOTHING;

-- 샘플 공지사항 생성 (운영진이 생성)
INSERT INTO announcements (id, author_id, title, content, announcement_type, is_important) VALUES
(uuid_generate_v4(), NULL, '플랜비 서비스 오픈!', '은퇴설계 커뮤니티 플랜비에 오신 것을 환영합니다!', 'general', true)
ON CONFLICT DO NOTHING;

-- 완료 메시지
SELECT 'Complete database schema created successfully! 🎉' as result;
SELECT 'Total tables created: 18' as info;
SELECT 'Total indexes created: 20+' as info;
SELECT 'Next step: Run simple-rls-policies.sql for security' as next_step;