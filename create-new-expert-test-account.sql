-- ================================
-- 새로운 전문가 테스트 계정 생성
-- planb.expert.test@gmail.com
-- ================================

-- 1. 새로운 전문가 계정을 위한 user_profiles 생성
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

-- 2. 해당 전문가의 완전한 experts 프로필 생성
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
        hourly_rate,
        consultation_duration,
        available_consultation_types,
        target_age_groups,
        service_areas,
        verification_status,
        is_verified,
        is_active,
        no_sales_pledge,
        senior_focused,
        experience_based,
        average_rating,
        total_reviews,
        total_consultations,
        consultation_fee,
        platform_fee_rate
    ) VALUES (
        'planb.expert.test@gmail.com',
        target_user_id,
        '김플랜비',
        '플랜비 시니어 여행 전문가',
        'travel_planner',
        'travel',
        ARRAY['시니어 국내여행', '해외여행', '배리어프리여행', '의료관광'],
        15,
        '20년간 시니어 맞춤 여행 기획 전문가입니다. 안전하고 편안한 여행을 설계합니다. 금융상품은 일체 판매하지 않으며, 순수하게 여행 계획과 노하우만 공유합니다.',
        '90,000원/시간',
        90,
        ARRAY['온라인', '오프라인', '전화'],
        ARRAY['40-50대', '50-60대', '60대이상'],
        ARRAY['전국', '제주', '부산', '강원'],
        'approved',
        true,
        true,
        true,
        true,
        true,
        4.9,
        67,
        234,
        90000.00,
        0.1000
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = target_user_id,
        verification_status = 'approved',
        is_verified = true,
        is_active = true;
        
    RAISE NOTICE '✅ 플랜비 전문가 프로필 생성 완료';
END $$;

-- 3. 샘플 상담 예약 데이터도 생성 (전문가 UI 테스트용)
INSERT INTO consultation_sessions (
    id,
    expert_id,
    client_id,
    scheduled_time,
    duration_minutes,
    consultation_type,
    status,
    notes,
    created_at
) 
SELECT 
    gen_random_uuid(),
    e.id,
    up.id,
    now() + interval '1 day',
    90,
    'online',
    'confirmed',
    '시니어 여행 상담 예약입니다.',
    now()
FROM experts e, user_profiles up
WHERE e.email = 'planb.expert.test@gmail.com'
AND up.email = 'actionlys@gmail.com'  -- 기존 고객
AND NOT EXISTS (
    SELECT 1 FROM consultation_sessions 
    WHERE expert_id = e.id AND client_id = up.id
)
LIMIT 1;

-- 4. 생성된 계정 정보 확인
SELECT '=== 생성된 전문가 계정 정보 ===' as account_info;

-- user_profiles 정보
SELECT 
    'user_profiles' as table_name,
    id,
    email,
    nickname,
    role,
    expert_status,
    created_at
FROM user_profiles 
WHERE email = 'planb.expert.test@gmail.com';

-- experts 정보  
SELECT 
    'experts' as table_name,
    id,
    email,
    name,
    title,
    expert_type,
    category,
    verification_status,
    is_verified,
    average_rating,
    total_reviews
FROM experts 
WHERE email = 'planb.expert.test@gmail.com';

-- 5. 로그인 안내
SELECT '📋 전문가 마이페이지 테스트 방법:' as test_instructions;
SELECT '1️⃣ Supabase Dashboard → Authentication → Users → Add user' as step1;
SELECT '2️⃣ Email: planb.expert.test@gmail.com' as step2;
SELECT '3️⃣ Password: planb123456 (임시 비밀번호)' as step3;
SELECT '4️⃣ Email confirmed 체크박스 활성화' as step4;
SELECT '5️⃣ Create user 클릭' as step5;
SELECT '6️⃣ 생성 후 해당 계정으로 플랜비 로그인' as step6;
SELECT '7️⃣ 마이페이지에서 "전문가" 표시 및 전문가 탭 확인' as step7;

-- 최종 메시지
SELECT '✅ 테스트 전문가 계정 DB 설정 완료!' as result;
SELECT '🔐 이제 Supabase Dashboard에서 Auth 계정만 생성하면 됩니다!' as auth_needed;
SELECT '🎯 완전히 새로운 전문가 계정으로 마이페이지 UI를 확인할 수 있습니다!' as purpose;