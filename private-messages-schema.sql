-- ================================
-- 플랜비 쪽지 시스템 스키마
-- 사용자 간 개인 메시지 교환 기능
-- ================================

-- 쪽지 메시지 테이블
CREATE TABLE IF NOT EXISTS private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT '제목 없음',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_is_read ON private_messages(is_read);

-- RLS 정책 활성화
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- 발신자는 자신이 보낸 메시지를 볼 수 있음
CREATE POLICY "Users can view their sent messages" ON private_messages
    FOR SELECT USING (
        auth.uid()::text = sender_id::text
    );

-- 수신자는 자신이 받은 메시지를 볼 수 있음  
CREATE POLICY "Users can view their received messages" ON private_messages
    FOR SELECT USING (
        auth.uid()::text = recipient_id::text
    );

-- 사용자는 새 메시지를 작성할 수 있음
CREATE POLICY "Users can send messages" ON private_messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id::text
    );

-- 수신자는 메시지를 읽음 처리할 수 있음
CREATE POLICY "Recipients can mark messages as read" ON private_messages
    FOR UPDATE USING (
        auth.uid()::text = recipient_id::text
    ) WITH CHECK (
        auth.uid()::text = recipient_id::text
    );

-- 관리자는 모든 메시지를 볼 수 있음 (모니터링용)
CREATE POLICY "Admins can view all messages" ON private_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_private_messages_updated_at 
    BEFORE UPDATE ON private_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 쪽지 통계를 위한 뷰
CREATE OR REPLACE VIEW user_message_stats AS
SELECT 
    u.id as user_id,
    u.nickname,
    u.email,
    COALESCE(sent.sent_count, 0) as sent_messages,
    COALESCE(received.received_count, 0) as received_messages,
    COALESCE(unread.unread_count, 0) as unread_messages
FROM user_profiles u
LEFT JOIN (
    SELECT sender_id, COUNT(*) as sent_count
    FROM private_messages
    GROUP BY sender_id
) sent ON u.id = sent.sender_id
LEFT JOIN (
    SELECT recipient_id, COUNT(*) as received_count
    FROM private_messages  
    GROUP BY recipient_id
) received ON u.id = received.recipient_id
LEFT JOIN (
    SELECT recipient_id, COUNT(*) as unread_count
    FROM private_messages
    WHERE is_read = FALSE
    GROUP BY recipient_id
) unread ON u.id = unread.recipient_id;

-- 샘플 데이터 (테스트용)
INSERT INTO private_messages (sender_id, recipient_id, subject, content) VALUES
-- 관리자가 보내는 환영 메시지들
(
    (SELECT id FROM user_profiles WHERE email = 'admin@planb.com' LIMIT 1),
    (SELECT id FROM user_profiles WHERE email = 'actionlys@gmail.com' LIMIT 1),
    '플랜비에 오신 것을 환영합니다!',
    '안녕하세요! 플랜비 운영진입니다.

플랜비 커뮤니티에 가입해 주셔서 감사합니다. 
은퇴 설계에 도움이 되는 다양한 기능들을 활용해보세요:

✅ 은퇴생활비 계산기로 미래 계획 수립
💬 같은 고민을 가진 분들과 소통
👨‍💼 검증된 전문가와 상담

궁금한 점이 있으시면 언제든 쪽지로 문의해주세요.
행복한 은퇴준비 되시길 바랍니다! 😊'
);

COMMENT ON TABLE private_messages IS '사용자 간 개인 쪽지 교환 시스템';
COMMENT ON COLUMN private_messages.sender_id IS '발신자 ID';  
COMMENT ON COLUMN private_messages.recipient_id IS '수신자 ID';
COMMENT ON COLUMN private_messages.subject IS '쪽지 제목';
COMMENT ON COLUMN private_messages.content IS '쪽지 내용';
COMMENT ON COLUMN private_messages.is_read IS '읽음 여부';
COMMENT ON COLUMN private_messages.read_at IS '읽은 시각';