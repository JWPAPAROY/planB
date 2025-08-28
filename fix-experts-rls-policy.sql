-- ================================
-- experts 테이블 RLS 정책 수정
-- 사용자가 본인 프로필은 조회 가능하도록 개선
-- ================================

-- 1. 현재 experts 테이블 RLS 정책 확인
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'experts' 
ORDER BY policyname;

-- 2. 문제가 있는 정책 삭제
DROP POLICY IF EXISTS "Public can view verified active experts" ON experts;
DROP POLICY IF EXISTS "Users can view verified experts" ON experts;

-- 3. 개선된 RLS 정책 생성

-- 공개 조회 정책 (검증된 전문가만 공개)
CREATE POLICY "Public can view verified experts" ON experts
    FOR SELECT USING (
        is_verified = true 
        AND is_active = true 
        AND no_sales_pledge = true
    );

-- 본인 프로필 조회 정책 (중요!)
CREATE POLICY "Users can view their own expert profile" ON experts
    FOR SELECT USING (
        auth.uid() = user_id OR
        email IN (
            SELECT email FROM user_profiles WHERE id = auth.uid()
        )
    );

-- 관리자 전체 조회 정책
CREATE POLICY "Admins can view all expert profiles" ON experts
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );

-- 4. 기존 INSERT/UPDATE 정책은 유지 (문제없음)
-- "Users can insert their own expert profile"
-- "Users can update their own expert profile" 
-- "Admins can manage all expert profiles"

-- 5. knowwhere86@gmail.com 사용자 상태 확인
SELECT '=== knowwhere86@gmail.com 전문가 프로필 상태 ===' as title;

SELECT 
    e.id,
    e.email,
    e.user_id,
    e.name,
    e.expert_type,
    e.category,
    e.verification_status,
    e.is_verified,
    e.is_active,
    e.no_sales_pledge,
    up.role as user_role,
    up.expert_status as user_expert_status
FROM experts e
LEFT JOIN user_profiles up ON e.user_id = up.id
WHERE e.email = 'knowwhere86@gmail.com';

-- 6. RLS 정책 테스트 (현재 사용자 관점에서)
SELECT '=== RLS 정책 테스트 ===' as test_title;

-- 현재 auth.uid() 확인
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL 
        THEN '✅ 인증됨: ' || auth.uid()::TEXT
        ELSE '❌ 인증되지 않음'
    END as auth_status;

-- knowwhere86@gmail.com으로 로그인했을 때 본인 프로필 조회 가능한지 테스트
-- (이 쿼리는 실제 로그인된 사용자만 성공함)
DO $$
DECLARE
    profile_count INTEGER := 0;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO profile_count 
        FROM experts 
        WHERE email = 'knowwhere86@gmail.com';
        
        RAISE NOTICE '✅ knowwhere86@gmail.com 프로필 조회 성공: % 건', profile_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ knowwhere86@gmail.com 프로필 조회 실패: %', SQLERRM;
    END;
END $$;

-- 7. 완료 확인
SELECT 
    COUNT(*) as total_policies,
    '✅ experts 테이블 RLS 정책: ' || COUNT(*) || '개 설정됨' as policy_status
FROM pg_policies 
WHERE tablename = 'experts';

-- 정책 세부 내용 확인
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%their own%' THEN '👤 본인 프로필'
        WHEN policyname LIKE '%verified%' THEN '👀 공개 조회'
        WHEN policyname LIKE '%admin%' THEN '👑 관리자'
        ELSE '📋 기타'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'experts'
ORDER BY policyname;

-- 완료 메시지
SELECT '✅ experts 테이블 RLS 정책 수정 완료!' as result;
SELECT '👤 이제 사용자가 본인 전문가 프로필을 조회할 수 있습니다.' as fix_applied;
SELECT '🔄 로그아웃 후 재로그인하여 마이페이지에서 전문가 표시 확인하세요.' as next_step;