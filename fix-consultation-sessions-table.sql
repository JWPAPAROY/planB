-- ================================
-- consultation_sessions 테이블 구조 수정
-- client_id 컬럼 및 필요한 컬럼들 추가
-- ================================

-- 1. 현재 consultation_sessions 테이블 구조 확인
SELECT '=== consultation_sessions 테이블 현재 구조 ===' as title;
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultation_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. consultation_sessions 테이블이 없다면 생성, 있다면 컬럼 추가
CREATE TABLE IF NOT EXISTS consultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 필요한 컬럼들 하나씩 추가
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS expert_id UUID REFERENCES experts(id) ON DELETE CASCADE;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'online' CHECK (consultation_type IN ('online', 'offline', 'phone', 'video'));
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS expert_notes TEXT;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS client_notes TEXT;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_expert_id ON consultation_sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_client_id ON consultation_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_scheduled_time ON consultation_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status);

-- 4. RLS 활성화 및 정책 설정
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own consultation sessions" ON consultation_sessions;
DROP POLICY IF EXISTS "Users can insert their own consultation sessions" ON consultation_sessions;
DROP POLICY IF EXISTS "Users can update their own consultation sessions" ON consultation_sessions;
DROP POLICY IF EXISTS "Admins can manage all consultation sessions" ON consultation_sessions;

-- 새 RLS 정책 생성
CREATE POLICY "Users can view their own consultation sessions" ON consultation_sessions
    FOR SELECT USING (
        auth.uid() = expert_id OR 
        auth.uid() = client_id OR
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );

CREATE POLICY "Users can insert consultation sessions" ON consultation_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR
        auth.uid() = expert_id OR
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%'
        )
    );

CREATE POLICY "Users can update their own consultation sessions" ON consultation_sessions
    FOR UPDATE USING (
        auth.uid() = expert_id OR 
        auth.uid() = client_id OR
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%'
        )
    );

-- 5. updated_at 트리거 추가
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_consultation_sessions_updated_at ON consultation_sessions;
        CREATE TRIGGER update_consultation_sessions_updated_at 
            BEFORE UPDATE ON consultation_sessions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ consultation_sessions updated_at 트리거 생성됨';
    END IF;
END $$;

-- 6. 새 전문가 계정 다시 생성 (컬럼 오류 없이)
INSERT INTO user_profiles (
    id,
    email,
    nickname, 
    role,
    expert_status,
    privacy_consent,
    privacy_consent_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'planb.expert.test@gmail.com',
    '플랜비전문가',
    'expert',
    'approved',
    true,
    now(),
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = 'expert',
    expert_status = 'approved',
    updated_at = now();

-- 7. 전문가 프로필 생성
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM user_profiles WHERE email = 'planb.expert.test@gmail.com';
    
    INSERT INTO experts (
        email,
        user_id,
        name,
        title,
        expert_type,
        category,
        specialties,
        experience_years,
        bio,
        verification_status,
        is_verified,
        is_active,
        no_sales_pledge,
        senior_focused,
        experience_based,
        average_rating,
        total_reviews,
        total_consultations
    ) VALUES (
        'planb.expert.test@gmail.com',
        target_user_id,
        '김플랜비',
        '시니어 여행 전문가',
        'travel_planner',
        'travel',
        ARRAY['시니어여행', '국내여행', '해외여행'],
        15,
        '20년간 시니어 여행 기획 전문가입니다.',
        'approved',
        true,
        true,
        true,
        true,
        true,
        4.9,
        67,
        234
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = target_user_id,
        verification_status = 'approved',
        is_verified = true,
        is_active = true;
END $$;

-- 8. 최종 확인
SELECT '=== 테이블 구조 수정 및 계정 생성 완료 ===' as completion;

-- consultation_sessions 테이블 구조 재확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultation_sessions' 
ORDER BY ordinal_position;

-- 생성된 전문가 계정 확인
SELECT 
    up.email,
    up.role,
    up.expert_status,
    e.name,
    e.verification_status,
    e.is_verified
FROM user_profiles up
JOIN experts e ON up.id = e.user_id
WHERE up.email = 'planb.expert.test@gmail.com';

-- 완료 메시지
SELECT '✅ consultation_sessions 테이블 구조 수정 완료!' as result;
SELECT '👨‍💼 planb.expert.test@gmail.com 전문가 계정 DB 준비 완료!' as expert_ready;
SELECT '🔐 이제 Supabase Dashboard에서 Auth 계정 생성하세요!' as next_step;
SELECT '📧 Email: planb.expert.test@gmail.com, Password: planb123456' as credentials;