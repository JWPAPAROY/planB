-- 플랜비 완전한 RLS 보안 정책
-- 실행 방법: missing-tables-schema.sql 실행 후 이 스크립트 실행

-- ================================
-- 기존 테이블들의 RLS 활성화 및 정책
-- ================================

-- 사용자 계산 데이터 테이블
ALTER TABLE user_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User calculations access" ON user_calculations FOR ALL USING (
  user_hash = current_setting('app.current_user_hash', true) OR
  auth.uid() IS NOT NULL
);

-- 지출 내역 테이블  
ALTER TABLE user_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User expenses access" ON user_expenses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_calculations 
    WHERE id = user_expenses.calculation_id 
    AND (user_hash = current_setting('app.current_user_hash', true) OR auth.uid() IS NOT NULL)
  )
);

-- 사용자 프로필 테이블
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User profiles own access" ON user_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "User profiles public read" ON user_profiles FOR SELECT USING (true);

-- 커뮤니티 게시글 테이블
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community posts public read" ON community_posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Community posts user write" ON community_posts FOR INSERT WITH CHECK (
  user_hash IS NOT NULL OR auth.uid() IS NOT NULL
);
CREATE POLICY "Community posts own modify" ON community_posts FOR UPDATE USING (
  user_hash = current_setting('app.current_user_hash', true) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND id = community_posts.user_id)
);

-- 커뮤니티 댓글 테이블
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community replies public read" ON community_replies FOR SELECT USING (is_deleted = false);
CREATE POLICY "Community replies user write" ON community_replies FOR INSERT WITH CHECK (
  user_hash IS NOT NULL OR auth.uid() IS NOT NULL
);
CREATE POLICY "Community replies own modify" ON community_replies FOR UPDATE USING (
  user_hash = current_setting('app.current_user_hash', true) OR auth.uid() IS NOT NULL
);

-- 전문가 프로필 테이블 (financial_experts)
ALTER TABLE financial_experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financial experts public read" ON financial_experts FOR SELECT USING (status = 'active');
CREATE POLICY "Financial experts own access" ON financial_experts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND email = financial_experts.email)
);
CREATE POLICY "Financial experts admin access" ON financial_experts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 상담 세션 테이블 (consultation_sessions)
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultation sessions participant access" ON consultation_sessions FOR ALL USING (
  user_hash = current_setting('app.current_user_hash', true) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) OR
  expert_id = auth.uid()
);

-- 상담 리뷰 테이블
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultation reviews public read" ON consultation_reviews FOR SELECT USING (true);
CREATE POLICY "Consultation reviews participant write" ON consultation_reviews FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultation_sessions 
    WHERE id = consultation_reviews.session_id 
    AND (user_hash = current_setting('app.current_user_hash', true) OR auth.uid() IS NOT NULL)
  )
);

-- ================================
-- 새로운 테이블들의 상세 RLS 정책
-- ================================

-- 채팅방 RLS 정책
CREATE POLICY "Chat rooms participant read" ON chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = chat_rooms.id 
    AND (user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true))
    AND is_active = true
  )
);
CREATE POLICY "Chat rooms create" ON chat_rooms FOR INSERT WITH CHECK (created_by = auth.uid());

-- 채팅 메시지 RLS 정책  
CREATE POLICY "Chat messages participant access" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = chat_messages.room_id 
    AND (user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true))
    AND is_active = true
  )
);
CREATE POLICY "Chat messages user write" ON chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true)
);
CREATE POLICY "Chat messages own modify" ON chat_messages FOR UPDATE USING (
  user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true)
);

-- 채팅 참여자 RLS 정책
CREATE POLICY "Chat participants self read" ON chat_participants FOR SELECT USING (
  user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true)
);
CREATE POLICY "Chat participants room admin" ON chat_participants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants admin_check
    WHERE admin_check.room_id = chat_participants.room_id 
    AND admin_check.user_id = auth.uid() 
    AND admin_check.role IN ('admin', 'moderator')
  )
);

-- 공지사항 조회 기록 RLS 정책
CREATE POLICY "Announcement views own access" ON announcement_views FOR ALL USING (
  user_id = auth.uid() OR user_hash = current_setting('app.current_user_hash', true)
);

-- 전문가 게시글 상세 RLS 정책
CREATE POLICY "Expert posts own access" ON expert_posts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM financial_experts 
    WHERE id = expert_posts.expert_id 
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND email = financial_experts.email)
  )
);
CREATE POLICY "Expert posts admin access" ON expert_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- ================================
-- 관리자 전용 정책들
-- ================================

-- 관리자는 모든 테이블에 접근 가능
CREATE POLICY "Admin full access user_calculations" ON user_calculations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admin full access community_posts" ON community_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admin full access community_replies" ON community_replies FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admin full access chat_rooms" ON chat_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admin full access chat_messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admin full access announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- ================================
-- Storage 버킷 정책들
-- ================================

-- Storage 버킷 생성 (이미 있으면 스킵됨)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('chat-files', 'chat-files', false),
  ('expert-documents', 'expert-documents', false),
  ('profile-images', 'profile-images', false)
ON CONFLICT (id) DO NOTHING;

-- chat-files 버킷 정책
CREATE POLICY "Chat files user upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Chat files user read" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat-files' AND
  auth.uid() IS NOT NULL
);

-- expert-documents 버킷 정책  
CREATE POLICY "Expert docs upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'expert-documents' AND
  EXISTS (SELECT 1 FROM financial_experts WHERE email IN (SELECT email FROM user_profiles WHERE id = auth.uid()))
);
CREATE POLICY "Expert docs read" ON storage.objects FOR SELECT USING (
  bucket_id = 'expert-documents' AND
  (
    EXISTS (SELECT 1 FROM financial_experts WHERE email IN (SELECT email FROM user_profiles WHERE id = auth.uid())) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  )
);

-- profile-images 버킷 정책
CREATE POLICY "Profile images user upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Profile images public read" ON storage.objects FOR SELECT USING (
  bucket_id = 'profile-images'
);

-- ================================
-- 유틸리티 함수들
-- ================================

-- 현재 사용자 해시 설정 함수
CREATE OR REPLACE FUNCTION set_current_user_hash(hash_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_hash', hash_value, true);
END;
$$ LANGUAGE plpgsql;

-- 사용자 타입 확인 함수
CREATE OR REPLACE FUNCTION get_user_type(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT user_type FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- 전문가 여부 확인 함수  
CREATE OR REPLACE FUNCTION is_expert(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM financial_experts 
    WHERE email IN (SELECT email FROM user_profiles WHERE id = user_id)
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'Complete RLS policies created successfully!' as result;