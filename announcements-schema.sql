-- 공지사항 테이블 생성
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_important BOOLEAN DEFAULT false, -- 중요 공지사항 여부 (상단 고정)
    is_active BOOLEAN DEFAULT true,     -- 공지사항 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 공지사항 조회수 테이블
CREATE TABLE announcement_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(announcement_id, user_id) -- 한 사용자당 한 번만 조회수 카운트
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_is_important ON announcements(is_important, is_active, created_at DESC);
CREATE INDEX idx_announcement_views_announcement_id ON announcement_views(announcement_id);

-- Row Level Security 활성화
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- 공지사항 읽기 정책 (모든 사용자 읽기 가능)
CREATE POLICY "Anyone can read active announcements" ON announcements
    FOR SELECT USING (is_active = true);

-- 공지사항 작성/수정/삭제 정책 (관리자만)
CREATE POLICY "Only admins can manage announcements" ON announcements
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 조회수 정책
CREATE POLICY "Users can read their own views" ON announcement_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views" ON announcement_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 공지사항 자동 업데이트 시간 설정 함수
CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcement_updated_at();

-- 샘플 공지사항 데이터
INSERT INTO announcements (title, content, is_important) VALUES
(
    '플랜비 서비스 오픈 안내',
    '안녕하세요, 플랜비입니다.

은퇴 설계를 위한 커뮤니티 플랫폼 플랜비가 정식 오픈되었습니다!

주요 기능:
• 은퇴생활비 계산기 - 개인 맞춤형 은퇴 자금 계산
• 커뮤니티 - 같은 고민을 가진 사람들과의 소통
• 전문가 찾기 - 신뢰할 수 있는 재무 전문가 연결

많은 이용 부탁드립니다. 😊',
    true
),
(
    '서비스 이용 안내',
    '플랜비 서비스 이용 시 다음 사항을 참고해 주세요.

• 회원가입 시 실명 인증을 권장합니다.
• 전문가 상담은 플랫폼 내에서 안전하게 진행됩니다.
• 개인정보는 철저히 보호됩니다.

궁금한 사항이 있으시면 언제든 문의해 주세요.',
    false
);