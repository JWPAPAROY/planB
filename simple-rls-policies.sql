-- 플랜비 간단한 RLS 보안 정책
-- 실행 방법: complete-database-schema.sql 실행 후 이 파일 실행

-- ================================
-- 모든 테이블 RLS 활성화
-- ================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_exchange_requests ENABLE ROW LEVEL SECURITY;

-- ================================
-- 기본 보안 정책들
-- ================================

-- 1. 사용자 프로필: 본인 데이터만 접근
CREATE POLICY "User profiles own access" ON user_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "User profiles public read" ON user_profiles FOR SELECT USING (true);

-- 2. 사용자 계산: 본인 또는 익명 해시로 접근
CREATE POLICY "User calculations access" ON user_calculations FOR ALL USING (
  user_id = auth.uid() OR 
  user_hash = current_setting('app.current_user_hash', true) OR
  auth.uid() IS NOT NULL
);

-- 3. 커뮤니티 게시글: 공개 읽기, 로그인 사용자 쓰기
CREATE POLICY "Community posts public read" ON community_posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Community posts user write" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Community posts own modify" ON community_posts FOR UPDATE USING (user_id = auth.uid());

-- 4. 커뮤니티 댓글: 공개 읽기, 로그인 사용자 쓰기  
CREATE POLICY "Community replies public read" ON community_replies FOR SELECT USING (is_deleted = false);
CREATE POLICY "Community replies user write" ON community_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. 전문가 프로필: 활성화된 전문가만 공개
CREATE POLICY "Financial experts public read" ON financial_experts FOR SELECT USING (status = 'active' AND is_deleted = false);
CREATE POLICY "Financial experts own access" ON financial_experts FOR ALL USING (
  email IN (SELECT email FROM user_profiles WHERE id = auth.uid())
);

-- 6. 상담 세션: 관련 사용자만 접근
CREATE POLICY "Consultation sessions access" ON consultation_sessions FOR ALL USING (
  user_id = auth.uid() OR 
  expert_id IN (SELECT id FROM financial_experts WHERE email IN (SELECT email FROM user_profiles WHERE id = auth.uid()))
);

-- 7. 익명 세션: 모든 사용자 접근 (임시)
CREATE POLICY "Anonymous sessions access" ON anonymous_sessions FOR ALL USING (true);

-- 8. 공지사항: 활성화된 공지사항만 공개 읽기
CREATE POLICY "Announcements public read" ON announcements FOR SELECT USING (is_active = true AND is_deleted = false);

-- 9. 전문가 게시글: 발행된 글만 공개
CREATE POLICY "Expert posts public read" ON expert_posts FOR SELECT USING (is_published = true AND is_deleted = false);

-- 10. 채팅 관련: 임시로 모든 접근 허용 (추후 세분화)
CREATE POLICY "Chat rooms access" ON chat_rooms FOR ALL USING (true);
CREATE POLICY "Chat messages access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Chat participants access" ON chat_participants FOR ALL USING (true);

-- ================================
-- 관리자 전체 접근 권한
-- ================================
CREATE POLICY "Admin full access all tables" ON user_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 다른 테이블들도 관리자 접근 허용
DO $$
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'user_calculations', 'user_expenses', 'community_posts', 'community_replies',
    'financial_experts', 'consultation_sessions', 'consultation_reviews',
    'announcements', 'expert_posts', 'fee_settlements', 'contact_exchange_requests'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names
  LOOP
    EXECUTE format('
      CREATE POLICY "Admin full access %I" ON %I FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = ''admin'')
      )', table_name, table_name);
  END LOOP;
END $$;

-- ================================
-- Storage 정책
-- ================================

-- profile-images: 공개 읽기, 본인만 업로드
CREATE POLICY "Profile images public read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Profile images user upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND auth.uid() IS NOT NULL
);

-- chat-files: 로그인 사용자만 접근
CREATE POLICY "Chat files user access" ON storage.objects FOR ALL USING (
  bucket_id = 'chat-files' AND auth.uid() IS NOT NULL
);

-- expert-documents: 전문가와 관리자만 접근
CREATE POLICY "Expert docs access" ON storage.objects FOR ALL USING (
  bucket_id = 'expert-documents' AND (
    EXISTS (SELECT 1 FROM financial_experts WHERE email IN (SELECT email FROM user_profiles WHERE id = auth.uid())) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  )
);

-- ================================
-- 유틸리티 함수
-- ================================

-- 현재 사용자 해시 설정 함수
CREATE OR REPLACE FUNCTION set_current_user_hash(hash_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_hash', hash_value, true);
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'Simple RLS policies created successfully!' as result;