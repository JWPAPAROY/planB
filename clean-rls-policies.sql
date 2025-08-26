-- 플랜비 RLS 정책 완전 재설정 (기존 정책 삭제 후 재생성)
-- 실행 방법: complete-database-schema.sql 실행 후 이 파일 실행

-- ================================
-- 1단계: 모든 기존 RLS 정책 삭제
-- ================================

-- user_profiles 테이블
DROP POLICY IF EXISTS "User profiles own access" ON user_profiles;
DROP POLICY IF EXISTS "User profiles public read" ON user_profiles;
DROP POLICY IF EXISTS "User profiles limited read" ON user_profiles;
DROP POLICY IF EXISTS "User profiles insert" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access all tables" ON user_profiles;

-- user_calculations 테이블  
DROP POLICY IF EXISTS "User calculations access" ON user_calculations;
DROP POLICY IF EXISTS "Admin full access user_calculations" ON user_calculations;
DROP POLICY IF EXISTS "Admin access user_calculations" ON user_calculations;

-- community_posts 테이블
DROP POLICY IF EXISTS "Community posts public read" ON community_posts;
DROP POLICY IF EXISTS "Community posts user write" ON community_posts;
DROP POLICY IF EXISTS "Community posts own modify" ON community_posts;
DROP POLICY IF EXISTS "Admin access community_posts" ON community_posts;

-- community_replies 테이블
DROP POLICY IF EXISTS "Community replies public read" ON community_replies;
DROP POLICY IF EXISTS "Community replies user write" ON community_replies;
DROP POLICY IF EXISTS "Admin access community_replies" ON community_replies;

-- financial_experts 테이블
DROP POLICY IF EXISTS "Financial experts public read" ON financial_experts;
DROP POLICY IF EXISTS "Financial experts own access" ON financial_experts;
DROP POLICY IF EXISTS "Admin access financial_experts" ON financial_experts;

-- consultation_sessions 테이블
DROP POLICY IF EXISTS "Consultation sessions access" ON consultation_sessions;
DROP POLICY IF EXISTS "Admin access consultation_sessions" ON consultation_sessions;

-- consultation_reviews 테이블
DROP POLICY IF EXISTS "Admin access consultation_reviews" ON consultation_reviews;

-- 기타 테이블들
DROP POLICY IF EXISTS "Anonymous sessions access" ON anonymous_sessions;
DROP POLICY IF EXISTS "Announcements public read" ON announcements;
DROP POLICY IF EXISTS "Admin access announcements" ON announcements;
DROP POLICY IF EXISTS "Expert posts public read" ON expert_posts;
DROP POLICY IF EXISTS "Admin access expert_posts" ON expert_posts;
DROP POLICY IF EXISTS "Chat rooms access" ON chat_rooms;
DROP POLICY IF EXISTS "Chat messages access" ON chat_messages;
DROP POLICY IF EXISTS "Chat participants access" ON chat_participants;
DROP POLICY IF EXISTS "Admin access fee_settlements" ON fee_settlements;
DROP POLICY IF EXISTS "Admin access contact_exchange_requests" ON contact_exchange_requests;

-- Storage 정책들
DROP POLICY IF EXISTS "Profile images public read" ON storage.objects;
DROP POLICY IF EXISTS "Profile images user upload" ON storage.objects;
DROP POLICY IF EXISTS "Chat files user access" ON storage.objects;
DROP POLICY IF EXISTS "Expert docs access" ON storage.objects;

-- ================================
-- 2단계: 모든 테이블 RLS 활성화
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
-- 3단계: 새로운 RLS 정책 생성 (무한 재귀 방지)
-- ================================

-- 1. 사용자 프로필 정책 (간단하고 안전함)
CREATE POLICY "user_profiles_own_data" ON user_profiles FOR ALL USING (
  id = auth.uid()
);

CREATE POLICY "user_profiles_insert_new" ON user_profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- 2. 사용자 계산 데이터 정책
CREATE POLICY "user_calculations_access" ON user_calculations FOR ALL USING (
  user_id = auth.uid() OR 
  user_hash = current_setting('app.current_user_hash', true) OR
  auth.uid() IS NOT NULL
);

-- 3. 커뮤니티 게시글 정책
CREATE POLICY "community_posts_read" ON community_posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "community_posts_write" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_posts_update" ON community_posts FOR UPDATE USING (user_id = auth.uid());

-- 4. 커뮤니티 댓글 정책
CREATE POLICY "community_replies_read" ON community_replies FOR SELECT USING (is_deleted = false);
CREATE POLICY "community_replies_write" ON community_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. 전문가 프로필 정책
CREATE POLICY "financial_experts_read" ON financial_experts FOR SELECT USING (
  status = 'active' AND is_deleted = false
);
CREATE POLICY "financial_experts_own" ON financial_experts FOR ALL USING (
  auth.email() = email
);

-- 6. 상담 세션 정책  
CREATE POLICY "consultation_sessions_access" ON consultation_sessions FOR ALL USING (
  user_id = auth.uid() OR 
  expert_id IN (SELECT id FROM financial_experts WHERE email = auth.email())
);

-- 7. 기타 테이블들 (단순한 정책)
CREATE POLICY "anonymous_sessions_all" ON anonymous_sessions FOR ALL USING (true);
CREATE POLICY "announcements_read" ON announcements FOR SELECT USING (is_active = true AND is_deleted = false);
CREATE POLICY "expert_posts_read" ON expert_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "chat_rooms_all" ON chat_rooms FOR ALL USING (true);
CREATE POLICY "chat_messages_all" ON chat_messages FOR ALL USING (true);
CREATE POLICY "chat_participants_all" ON chat_participants FOR ALL USING (true);

-- ================================
-- 4단계: Storage 정책
-- ================================

-- profile-images 버킷
CREATE POLICY "profile_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "profile_images_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND auth.uid() IS NOT NULL
);

-- chat-files 버킷
CREATE POLICY "chat_files_access" ON storage.objects FOR ALL USING (
  bucket_id = 'chat-files' AND auth.uid() IS NOT NULL
);

-- expert-documents 버킷
CREATE POLICY "expert_docs_access" ON storage.objects FOR ALL USING (
  bucket_id = 'expert-documents' AND 
  auth.email() IN (SELECT email FROM financial_experts)
);

-- ================================
-- 5단계: 유틸리티 함수
-- ================================

CREATE OR REPLACE FUNCTION set_current_user_hash(hash_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_hash', hash_value, true);
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT 'Clean RLS policies setup completed successfully! All conflicts resolved.' as result;