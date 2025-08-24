-- 파일 저장소 및 클라우드 스토리지 스키마

-- Supabase Storage 버킷 생성
-- chat-files 버킷: 채팅에서 공유되는 파일들
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-files',
    'chat-files',
    false, -- 프라이빗 버킷 (인증된 사용자만 접근)
    10485760, -- 10MB 제한
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/zip',
        'text/plain',
        'text/csv'
    ]
);

-- expert-documents 버킷: 전문가 자격증 및 문서
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'expert-documents',
    'expert-documents',
    false, -- 프라이빗 버킷 (관리자와 해당 전문가만 접근)
    20971520, -- 20MB 제한
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
);

-- profile-images 버킷: 사용자 프로필 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images',
    'profile-images',
    true, -- 퍼블릭 버킷 (프로필 이미지는 공개)
    5242880, -- 5MB 제한
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
);

-- 파일 메타데이터 테이블 (업로드된 파일 추적)
CREATE TABLE file_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    related_table TEXT, -- 'chat_messages', 'user_profiles', 'expert_applications' 등
    related_id UUID, -- 관련 테이블의 ID
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 파일 접근 로그 테이블 (보안 및 모니터링)
CREATE TABLE file_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_type TEXT CHECK (access_type IN ('view', 'download', 'delete')) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_related ON file_uploads(related_table, related_id);
CREATE INDEX idx_file_uploads_bucket ON file_uploads(bucket_name);
CREATE INDEX idx_file_access_logs_file_id ON file_access_logs(file_upload_id);
CREATE INDEX idx_file_access_logs_accessed_by ON file_access_logs(accessed_by);
CREATE INDEX idx_file_access_logs_created_at ON file_access_logs(created_at);

-- Row Level Security 활성화
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;

-- 파일 업로드 정책
CREATE POLICY "Users can view files they uploaded or have access to" ON file_uploads
    FOR SELECT USING (
        uploaded_by = auth.uid() OR
        -- 채팅 메시지의 파일은 해당 채팅방 참여자만 접근
        (related_table = 'chat_messages' AND related_id IN (
            SELECT cm.id FROM chat_messages cm
            JOIN chat_participants cp ON cp.room_id = cm.room_id
            WHERE cp.user_id = auth.uid() AND cp.is_active = true
        )) OR
        -- 관리자는 모든 파일 접근 가능
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own files" ON file_uploads
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 파일 접근 로그 정책
CREATE POLICY "Users can view their own access logs" ON file_access_logs
    FOR SELECT USING (
        accessed_by = auth.uid() OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "System can create access logs" ON file_access_logs
    FOR INSERT WITH CHECK (true);

-- Supabase Storage 정책 (RLS)

-- chat-files 버킷 정책
CREATE POLICY "Users can upload files to chat-files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view chat files they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-files' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            -- 채팅방 참여자는 해당 방의 파일에 접근 가능
            EXISTS (
                SELECT 1 FROM chat_messages cm
                JOIN chat_participants cp ON cp.room_id = cm.room_id
                WHERE cm.file_url = name AND cp.user_id = auth.uid() AND cp.is_active = true
            ) OR
            -- 관리자는 모든 파일 접근 가능
            auth.uid() IN (
                SELECT user_id FROM user_profiles 
                WHERE role = 'admin' OR role = 'super_admin'
            )
        )
    );

-- expert-documents 버킷 정책
CREATE POLICY "Experts can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'expert-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Experts and admins can view expert documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'expert-documents' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            auth.uid() IN (
                SELECT user_id FROM user_profiles 
                WHERE role = 'admin' OR role = 'super_admin'
            )
        )
    );

-- profile-images 버킷 정책 (퍼블릭이므로 누구나 조회 가능)
CREATE POLICY "Anyone can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자동 업데이트 시간 설정 트리거
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at(); -- 기존 함수 재사용

-- 파일 업로드 시 메타데이터 자동 생성 함수
CREATE OR REPLACE FUNCTION create_file_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- 파일 업로드 메타데이터 생성
    INSERT INTO file_uploads (
        bucket_name,
        file_path,
        original_filename,
        file_size,
        mime_type,
        uploaded_by
    ) VALUES (
        NEW.bucket_id,
        NEW.name,
        NEW.metadata->>'original_filename',
        NEW.metadata->>'size',
        NEW.metadata->>'mimetype',
        NEW.owner
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 파일 업로드 시 메타데이터 생성 트리거 (Supabase Storage)
-- 참고: 이 트리거는 Supabase에서 직접 설정해야 할 수 있음
-- CREATE TRIGGER auto_create_file_metadata
--     AFTER INSERT ON storage.objects
--     FOR EACH ROW
--     EXECUTE FUNCTION create_file_metadata();

-- 파일 다운로드 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_download_count(file_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE file_uploads 
    SET download_count = download_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = file_id;
    
    -- 접근 로그 기록
    INSERT INTO file_access_logs (
        file_upload_id,
        accessed_by,
        access_type
    ) VALUES (
        file_id,
        auth.uid(),
        'download'
    );
END;
$$ LANGUAGE plpgsql;

-- 파일 정리 함수 (비활성 파일 및 임시 파일 정리)
CREATE OR REPLACE FUNCTION cleanup_inactive_files()
RETURNS void AS $$
BEGIN
    -- 30일 이상 된 비활성 파일 삭제
    UPDATE file_uploads 
    SET is_active = false
    WHERE is_active = true 
    AND created_at < NOW() - INTERVAL '30 days'
    AND related_table IS NULL; -- 관련 없는 임시 파일들만
    
    -- 실제 스토리지에서 파일 삭제는 별도 배치 작업으로 처리 필요
END;
$$ LANGUAGE plpgsql;

-- 파일 저장소 사용량 조회 뷰
CREATE VIEW file_storage_usage AS
SELECT 
    bucket_name,
    COUNT(*) as file_count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_file_size,
    SUM(download_count) as total_downloads
FROM file_uploads 
WHERE is_active = true
GROUP BY bucket_name;

-- 사용자별 파일 업로드 통계 뷰
CREATE VIEW user_file_stats AS
SELECT 
    up.nickname,
    up.email,
    COUNT(fu.*) as uploaded_files,
    SUM(fu.file_size) as total_storage_used,
    SUM(fu.download_count) as total_downloads
FROM user_profiles up
LEFT JOIN file_uploads fu ON fu.uploaded_by = up.user_id AND fu.is_active = true
GROUP BY up.user_id, up.nickname, up.email;

-- 최근 파일 활동 뷰
CREATE VIEW recent_file_activity AS
SELECT 
    fu.original_filename,
    fu.file_size,
    up.nickname as uploader,
    fal.access_type,
    fal.created_at as activity_time
FROM file_access_logs fal
JOIN file_uploads fu ON fu.id = fal.file_upload_id
LEFT JOIN user_profiles up ON up.user_id = fal.accessed_by
ORDER BY fal.created_at DESC
LIMIT 100;