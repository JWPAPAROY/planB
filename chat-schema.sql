-- 실시간 채팅 시스템 스키마

-- 채팅방 테이블
CREATE TABLE chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT CHECK (room_type IN ('general', 'expert', 'private')) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 100,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 채팅 메시지 테이블
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_nickname TEXT NOT NULL, -- 닉네임 저장 (탈퇴 사용자 대응)
    message_text TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
    is_pinned BOOLEAN DEFAULT false, -- 고정 메시지 여부
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL, -- 답글 기능
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 채팅방 참여자 테이블
CREATE TABLE chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
    is_active BOOLEAN DEFAULT true, -- 채팅방 탈퇴 여부
    UNIQUE(room_id, user_id)
);

-- 메시지 읽음 상태 테이블
CREATE TABLE message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_participants_room ON chat_participants(room_id, is_active);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id, is_active);
CREATE INDEX idx_message_read_status_user ON message_read_status(user_id);

-- Row Level Security 활성화
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- 채팅방 정책
CREATE POLICY "Anyone can read active chat rooms" ON chat_rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators and admins can update rooms" ON chat_rooms
    FOR UPDATE USING (
        auth.uid() = created_by OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 채팅 메시지 정책
CREATE POLICY "Participants can read messages" ON chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Participants can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- 채팅방 참여자 정책
CREATE POLICY "Participants can read room participants" ON chat_participants
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can join rooms" ON chat_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON chat_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- 메시지 읽음 상태 정책
CREATE POLICY "Users can manage their read status" ON message_read_status
    FOR ALL USING (auth.uid() = user_id);

-- 자동 업데이트 시간 설정 함수
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

-- 실시간 구독 활성화 (Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;

-- 기본 채팅방 생성
INSERT INTO chat_rooms (name, description, room_type) VALUES
(
    '💬 자유 대화',
    '플랜비 커뮤니티 회원들과 자유롭게 대화하는 공간입니다.',
    'general'
),
(
    '📊 은퇴 설계 토론',
    '은퇴 계획과 재무 설계에 대해 토론하는 전문 채팅방입니다.',
    'general'
),
(
    '🏥 건강 관리',
    '건강한 노후를 위한 건강 정보와 팁을 공유하는 공간입니다.',
    'general'
),
(
    '🎯 전문가 상담실',
    '전문가와 1:1 상담을 위한 프라이빗 채팅 공간입니다.',
    'expert'
);