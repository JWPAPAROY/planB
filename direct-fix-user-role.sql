-- ================================
-- knowwhere86@gmail.com 직접 전문가 권한 부여
-- 즉시 확인 및 수정
-- ================================

-- 1. 현재 상태 정확히 진단
SELECT '=== knowwhere86@gmail.com 현재 상태 진단 ===' as title;

-- user_profiles 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('role', 'expert_status')
ORDER BY column_name;

-- 현재 사용자 정보 확인
SELECT 
    id,
    email,
    nickname,
    role,
    expert_status,
    created_at,
    updated_at
FROM user_profiles 
WHERE email = 'knowwhere86@gmail.com';

-- experts 테이블에서 해당 사용자 확인
SELECT 
    id,
    email,
    user_id,
    name,
    title,
    expert_type,
    category,
    verification_status,
    is_verified,
    is_active,
    no_sales_pledge
FROM experts 
WHERE email = 'knowwhere86@gmail.com';

-- 2. role 컬럼이 없다면 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('guest', 'member', 'expert', 'admin'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expert_status TEXT DEFAULT NULL CHECK (expert_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 3. knowwhere86@gmail.com을 강제로 전문가로 설정
UPDATE user_profiles 
SET 
    role = 'expert',
    expert_status = 'pending',
    updated_at = now()
WHERE email = 'knowwhere86@gmail.com';

-- 4. experts 테이블에도 데이터가 없다면 추가
DO $$
DECLARE
    target_user_id UUID;
    expert_exists BOOLEAN := false;
BEGIN
    -- 사용자 ID 가져오기
    SELECT id INTO target_user_id FROM user_profiles WHERE email = 'knowwhere86@gmail.com';
    
    -- experts 테이블에 이미 있는지 확인
    SELECT EXISTS (SELECT 1 FROM experts WHERE email = 'knowwhere86@gmail.com') INTO expert_exists;
    
    IF target_user_id IS NOT NULL AND NOT expert_exists THEN
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
            experience_based
        ) VALUES (
            'knowwhere86@gmail.com',
            target_user_id,
            '전문가님',
            '플랜비 전문가',
            'travel_planner',
            'travel',
            ARRAY['여행계획', '시니어여행'],
            5,
            '플랜비 등록 전문가입니다.',
            'pending',
            false,
            true,
            true,
            true,
            true
        );
        RAISE NOTICE '✅ experts 테이블에 사용자 프로필 추가됨';
    ELSIF expert_exists THEN
        RAISE NOTICE '✅ experts 테이블에 이미 프로필 존재함';
    ELSE
        RAISE NOTICE '❌ user_profiles에서 사용자를 찾을 수 없음';
    END IF;
END $$;

-- 5. 수정 후 상태 재확인
SELECT '=== 수정 후 상태 확인 ===' as after_title;

-- user_profiles 확인
SELECT 
    id,
    email,
    nickname,
    role,
    expert_status,
    '✅ user_profiles 수정됨' as status
FROM user_profiles 
WHERE email = 'knowwhere86@gmail.com';

-- experts 테이블 확인
SELECT 
    id,
    email,
    user_id,
    name,
    verification_status,
    is_verified,
    '✅ experts 프로필 존재함' as status
FROM experts 
WHERE email = 'knowwhere86@gmail.com';

-- 6. RLS 정책 상태 확인
SELECT 
    COUNT(*) as policy_count,
    '✅ experts RLS 정책: ' || COUNT(*) || '개 활성화됨' as policy_status
FROM pg_policies 
WHERE tablename = 'experts';

-- 각 정책별 상세 정보
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%their own%' THEN '👤 본인 조회'
        WHEN policyname LIKE '%verified%' THEN '👀 공개 조회'  
        WHEN policyname LIKE '%admin%' THEN '👑 관리자'
        ELSE '📋 기타'
    END as policy_purpose
FROM pg_policies 
WHERE tablename = 'experts'
ORDER BY policyname;

-- 7. 프론트엔드 테스트용 쿼리 (실제 앱에서 실행되는 쿼리)
SELECT '=== 프론트엔드 쿼리 시뮬레이션 ===' as frontend_test;

-- getUserType에서 실행하는 쿼리
SELECT 
    id,
    verification_status,
    'getUserType() 쿼리 결과' as query_purpose
FROM experts 
WHERE email = 'knowwhere86@gmail.com';

-- getCurrentUser에서 실행하는 쿼리  
SELECT 
    id,
    email,
    nickname,
    role,
    expert_status,
    'getCurrentUser() 쿼리 결과' as query_purpose
FROM user_profiles 
WHERE email = 'knowwhere86@gmail.com';

-- 최종 메시지
SELECT '✅ knowwhere86@gmail.com 전문가 권한 직접 부여 완료!' as result;
SELECT '🔄 이제 로그아웃 후 재로그인해서 마이페이지를 확인하세요.' as instruction;
SELECT '🔍 콘솔에서 "Enhanced User Data"와 "User role from DB" 로그를 확인하세요.' as debug_tip;