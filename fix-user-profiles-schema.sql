-- ================================
-- user_profiles 테이블 스키마 수정
-- updated_at 컬럼 추가 및 role 시스템 완성
-- ================================

-- 1. 현재 user_profiles 테이블 구조 확인
SELECT '=== user_profiles 테이블 현재 구조 ===' as title;
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 누락된 컬럼들 추가
-- updated_at 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- role 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('guest', 'member', 'expert', 'admin'));

-- expert_status 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expert_status TEXT DEFAULT NULL CHECK (expert_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 3. 기존 데이터 업데이트 (role이 NULL인 경우)
UPDATE user_profiles 
SET role = 'member' 
WHERE role IS NULL;

-- 4. updated_at 트리거 추가 (있다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- 기존 트리거 삭제 후 재생성
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON user_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE '✅ user_profiles updated_at 트리거 생성됨';
    ELSE
        RAISE NOTICE '⚠️ update_updated_at_column 함수가 없어서 트리거 생성 건너뜀';
    END IF;
END $$;

-- 5. knowwhere86@gmail.com 직접 수정
UPDATE user_profiles 
SET 
    role = 'expert',
    expert_status = 'pending'
WHERE email = 'knowwhere86@gmail.com';

-- 6. experts 테이블 확인 및 추가
DO $$
DECLARE
    target_user_id UUID;
    expert_exists BOOLEAN := false;
BEGIN
    -- 사용자 ID 가져오기
    SELECT id INTO target_user_id FROM user_profiles WHERE email = 'knowwhere86@gmail.com';
    
    -- experts 테이블에 이미 있는지 확인
    SELECT EXISTS (SELECT 1 FROM experts WHERE email = 'knowwhere86@gmail.com') INTO expert_exists;
    
    IF target_user_id IS NOT NULL THEN
        IF NOT expert_exists THEN
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
                '플랜비 등록 전문가',
                'travel_planner',
                'travel',
                ARRAY['여행계획', '시니어여행', '은퇴설계'],
                5,
                '플랜비에서 활동하는 여행/취미 전문가입니다.',
                'pending',
                false,
                true,
                true,
                true,
                true
            );
            RAISE NOTICE '✅ experts 테이블에 프로필 추가됨';
        ELSE
            -- 기존 프로필 업데이트
            UPDATE experts 
            SET 
                user_id = target_user_id,
                verification_status = 'pending',
                is_active = true,
                no_sales_pledge = true,
                senior_focused = true,
                experience_based = true
            WHERE email = 'knowwhere86@gmail.com';
            RAISE NOTICE '✅ 기존 experts 프로필 업데이트됨';
        END IF;
    END IF;
END $$;

-- 7. 최종 검증
SELECT '=== 최종 검증 결과 ===' as final_title;

-- 수정된 user_profiles 확인
SELECT 
    'user_profiles' as table_name,
    id,
    email,
    nickname,
    role,
    expert_status,
    created_at,
    updated_at
FROM user_profiles 
WHERE email = 'knowwhere86@gmail.com';

-- experts 테이블 확인
SELECT 
    'experts' as table_name,
    id,
    email,
    user_id,
    name,
    expert_type,
    category,
    verification_status,
    is_verified,
    is_active
FROM experts 
WHERE email = 'knowwhere86@gmail.com';

-- user_id 일치성 확인
SELECT 
    CASE 
        WHEN up.id = e.user_id 
        THEN '✅ user_profiles와 experts user_id 일치함'
        ELSE '❌ user_id 불일치 - 데이터 정합성 문제'
    END as consistency_check,
    up.id as user_profiles_id,
    e.user_id as experts_user_id
FROM user_profiles up, experts e
WHERE up.email = 'knowwhere86@gmail.com' 
AND e.email = 'knowwhere86@gmail.com';

-- 8. 완료 메시지
SELECT '✅ user_profiles 스키마 수정 및 데이터 업데이트 완료!' as result;
SELECT '👤 knowwhere86@gmail.com이 전문가 권한으로 설정되었습니다.' as user_update;
SELECT '🔄 이제 로그아웃 후 재로그인하여 확인하세요.' as next_step;
SELECT '🔍 콘솔에서 "Enhanced User Data: role: expert" 확인하세요.' as debug_tip;