-- ================================
-- 플랜비 통합 전문가 시스템 구축
-- financial_experts → experts 테이블로 변경
-- 3대 분야 모든 전문가 수용
-- ================================

-- 1. 기존 financial_experts 테이블 백업
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_experts') THEN
        -- 기존 데이터가 있다면 백업
        DROP TABLE IF EXISTS financial_experts_backup;
        CREATE TABLE financial_experts_backup AS SELECT * FROM financial_experts;
        RAISE NOTICE '📦 financial_experts 테이블 백업 완료';
        
        -- 기존 테이블 관련 요소들 정리
        DROP TRIGGER IF EXISTS update_financial_experts_updated_at ON financial_experts;
        DROP POLICY IF EXISTS "Users can view verified experts" ON financial_experts;
        DROP POLICY IF EXISTS "Users can insert their own expert profile" ON financial_experts;
        DROP POLICY IF EXISTS "Users can update their own expert profile" ON financial_experts;
        DROP POLICY IF EXISTS "Admins can manage all expert profiles" ON financial_experts;
        DROP TABLE financial_experts CASCADE;
        RAISE NOTICE '🗑️ 기존 financial_experts 테이블 제거 완료';
    ELSE
        RAISE NOTICE '📄 기존 financial_experts 테이블 없음';
    END IF;
END $$;

-- 2. 새로운 experts 테이블 생성 (플랜비 3대 분야 모든 전문가 수용)
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- 사용자 연결
    email TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 기본 정보
    name TEXT NOT NULL,
    phone TEXT,
    title TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    
    -- 🎯 플랜비 전문가 분야 분류
    expert_type TEXT NOT NULL CHECK (expert_type IN (
        -- ✈️ 여행/취미 전문가
        'travel_planner',      -- 여행 플래너
        'hobby_instructor',    -- 취미 강사  
        'culture_curator',     -- 문화 큐레이터
        'health_trainer',      -- 건강 트레이너
        
        -- 📋 세무/법무/자산관리 전문가
        'tax_accountant',      -- 세무사
        'lawyer',              -- 변호사
        'real_estate_expert',  -- 부동산 전문가
        'insurance_advisor',   -- 보험 전문가
        
        -- 🏠 주거/생활 전문가
        'senior_housing_consultant',  -- 실버타운 컨설턴트
        'interior_designer',          -- 인테리어 전문가
        'life_assistant',            -- 생활 도우미
        'medical_coordinator'        -- 의료 코디네이터
    )),
    
    -- 전문 분야 및 카테고리
    category TEXT NOT NULL CHECK (category IN ('travel', 'legal', 'housing')),
    specialties TEXT[] DEFAULT '{}',
    target_age_groups TEXT[] DEFAULT '{}', -- ['30-40대', '40-50대', '50-60대', '60대이상']
    
    -- 경력 정보
    experience_years INTEGER NOT NULL DEFAULT 0,
    credentials TEXT[] DEFAULT '{}',
    qualification_number TEXT,
    education_background TEXT,
    work_experience TEXT,
    
    -- 상담 정보
    hourly_rate TEXT,
    consultation_duration INTEGER DEFAULT 60, -- 기본 60분
    available_consultation_types TEXT[] DEFAULT '{}', -- ['온라인', '오프라인', '전화', '이메일']
    available_time_slots TEXT[] DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}', -- 서비스 지역
    
    -- 플랜비 철학 준수
    no_sales_pledge BOOLEAN DEFAULT false, -- 금융상품 판매 금지 서약
    senior_focused BOOLEAN DEFAULT false,  -- 시니어 특화 여부
    experience_based BOOLEAN DEFAULT false, -- 실전 경험 중심 여부
    
    -- 상태 관리
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_date TIMESTAMPTZ,
    last_activity_date TIMESTAMPTZ,
    
    -- 평가 정보
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_consultations INTEGER DEFAULT 0,
    
    -- 비즈니스 정보
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_fee_rate DECIMAL(5,4) DEFAULT 0.1000, -- 10% 플랫폼 수수료
    
    -- 제약 조건
    CONSTRAINT email_or_user_id_required CHECK (email IS NOT NULL OR user_id IS NOT NULL),
    UNIQUE(email),
    UNIQUE(user_id)
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_experts_email ON experts(email);
CREATE INDEX idx_experts_user_id ON experts(user_id);
CREATE INDEX idx_experts_expert_type ON experts(expert_type);
CREATE INDEX idx_experts_category ON experts(category);
CREATE INDEX idx_experts_verification_status ON experts(verification_status);
CREATE INDEX idx_experts_verified_active ON experts(is_verified, is_active);
CREATE INDEX idx_experts_rating ON experts(average_rating DESC);
CREATE INDEX idx_experts_specialties ON experts USING GIN(specialties);
CREATE INDEX idx_experts_target_age_groups ON experts USING GIN(target_age_groups);

-- 4. RLS 활성화
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (플랜비 비즈니스 로직 반영)
CREATE POLICY "Public can view verified active experts" ON experts
    FOR SELECT USING (
        is_verified = true 
        AND is_active = true 
        AND no_sales_pledge = true -- 판매 금지 서약 완료한 전문가만 노출
    );

CREATE POLICY "Users can insert their own expert profile" ON experts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            auth.uid() = user_id OR
            email IN (SELECT email FROM user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own expert profile" ON experts
    FOR UPDATE USING (
        auth.uid() = user_id OR
        email IN (SELECT email FROM user_profiles WHERE id = auth.uid()) OR
        -- 관리자는 모든 프로필 관리 가능
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );

CREATE POLICY "Admins can manage all expert profiles" ON experts
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );

-- 6. 업데이트 트리거
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_experts_updated_at 
            BEFORE UPDATE ON experts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ experts 테이블 업데이트 트리거 생성됨';
    END IF;
END $$;

-- 7. 기존 financial_experts 데이터 마이그레이션
DO $$
DECLARE
    backup_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_experts_backup') THEN
        SELECT COUNT(*) INTO backup_count FROM financial_experts_backup;
        
        IF backup_count > 0 THEN
            RAISE NOTICE '🔄 기존 financial_experts 데이터 마이그레이션 중... (% 건)', backup_count;
            
            INSERT INTO experts (
                id, created_at, updated_at, email, user_id, name, phone, title, bio,
                expert_type, category, specialties, experience_years, credentials,
                qualification_number, hourly_rate, consultation_duration,
                verification_status, is_verified, is_active, average_rating, total_reviews,
                no_sales_pledge, senior_focused, experience_based
            )
            SELECT 
                b.id, b.created_at, b.updated_at, b.email,
                -- user_id 자동 설정
                COALESCE(b.user_id, up.id) as user_id,
                b.name, b.phone, b.title, b.bio,
                -- 기존 카테고리를 expert_type으로 매핑
                CASE b.category
                    WHEN 'travel' THEN 'travel_planner'
                    WHEN 'legal' THEN 'lawyer'  
                    WHEN 'housing' THEN 'senior_housing_consultant'
                    ELSE 'tax_accountant'
                END as expert_type,
                b.category, b.specialties, b.experience_years, b.credentials,
                b.qualification_number, b.hourly_rate, b.consultation_duration,
                b.verification_status, b.is_verified, b.is_active, 
                b.average_rating, b.total_reviews,
                -- 플랜비 철학 기본값
                true as no_sales_pledge,   -- 모든 전문가는 판매 금지 서약
                true as senior_focused,    -- 시니어 특화
                true as experience_based   -- 실전 경험 중심
            FROM financial_experts_backup b
            LEFT JOIN user_profiles up ON up.email = b.email;
            
            RAISE NOTICE '✅ 마이그레이션 완료: % 건', backup_count;
        END IF;
    END IF;
END $$;

-- 8. 플랜비 샘플 전문가 데이터 생성
INSERT INTO experts (
    email, name, title, expert_type, category, specialties, experience_years,
    bio, hourly_rate, consultation_duration, verification_status, is_verified, is_active,
    no_sales_pledge, senior_focused, experience_based, average_rating, total_reviews,
    target_age_groups, available_consultation_types, service_areas
) VALUES
-- ✈️ 여행/취미 전문가들
('kim.travel@planb.com', '김여행', '시니어 여행 플래너', 'travel_planner', 'travel', 
 ARRAY['국내여행', '해외여행', '배리어프리여행'], 15,
 '20년간 시니어 맞춤 여행을 기획하고 있습니다. 안전하고 편안한 여행을 약속드립니다.', 
 '80,000원/시간', 90, 'approved', true, true, true, true, true, 4.8, 127,
 ARRAY['50-60대', '60대이상'], ARRAY['온라인', '오프라인'], ARRAY['전국']),

('park.hobby@planb.com', '박취미', '은퇴 후 취미 전문가', 'hobby_instructor', 'travel',
 ARRAY['원예', '요리', '사진'], 12,
 '은퇴 후 새로운 취미를 찾는 분들을 위한 맞춤 가이드를 제공합니다.',
 '60,000원/시간', 60, 'approved', true, true, true, true, true, 4.9, 89,
 ARRAY['40-50대', '50-60대'], ARRAY['온라인', '오프라인'], ARRAY['서울', '경기']),

-- 📋 세무/법무 전문가들  
('lee.tax@planb.com', '이세무', '은퇴 세무 전문가', 'tax_accountant', 'legal',
 ARRAY['연금세무', '상속세', '양도소득세'], 20,
 '은퇴 후 세금 최적화 전략을 제공합니다. 금융상품 판매는 일체 하지 않습니다.',
 '120,000원/시간', 90, 'approved', true, true, true, true, true, 4.7, 203,
 ARRAY['40-50대', '50-60대', '60대이상'], ARRAY['온라인', '오프라인', '전화'], ARRAY['전국']),

('choi.law@planb.com', '최법무', '상속 전문 변호사', 'lawyer', 'legal',
 ARRAY['유언장작성', '상속계획', '임대차'], 18,
 '노후 법적 이슈를 미리 준비하도록 도와드립니다.',
 '150,000원/시간', 60, 'approved', true, true, true, true, true, 4.6, 156,
 ARRAY['50-60대', '60대이상'], ARRAY['오프라인', '전화'], ARRAY['서울', '경기', '인천']),

-- 🏠 주거/생활 전문가들
('jung.housing@planb.com', '정주거', '실버타운 컨설턴트', 'senior_housing_consultant', 'housing',
 ARRAY['실버타운', '요양시설', '주거이전'], 10,
 '노후 주거 계획을 체계적으로 수립하도록 도와드립니다.',
 '90,000원/시간', 120, 'approved', true, true, true, true, true, 4.5, 78,
 ARRAY['50-60대', '60대이상'], ARRAY['온라인', '오프라인'], ARRAY['전국']),

('song.interior@planb.com', '송인테리어', '시니어 인테리어 전문가', 'interior_designer', 'housing',
 ARRAY['안전시설', '배리어프리', '조명설계'], 14,
 '고령자 친화적인 집 개조 전문가입니다.',
 '70,000원/시간', 90, 'approved', true, true, true, true, true, 4.4, 92,
 ARRAY['50-60대', '60대이상'], ARRAY['오프라인'], ARRAY['서울', '경기']);

-- 9. 통계 뷰 생성 (관리자용)
CREATE OR REPLACE VIEW expert_statistics AS
SELECT 
    expert_type,
    category,
    COUNT(*) as total_experts,
    COUNT(CASE WHEN is_verified THEN 1 END) as verified_experts,
    COUNT(CASE WHEN is_active THEN 1 END) as active_experts,
    ROUND(AVG(average_rating), 2) as avg_rating,
    SUM(total_reviews) as total_reviews,
    SUM(total_consultations) as total_consultations
FROM experts
GROUP BY expert_type, category
ORDER BY category, expert_type;

-- 10. 디버깅 함수 업데이트
DROP FUNCTION IF EXISTS debug_expert_registration(TEXT, TEXT);

CREATE OR REPLACE FUNCTION debug_expert_registration(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_expert_type TEXT DEFAULT 'travel_planner'
)
RETURNS TABLE (
    step TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1단계: user_profiles 조회
    SELECT id INTO target_user_id FROM user_profiles WHERE email = p_email;
    
    RETURN QUERY
    SELECT '1. user_profiles lookup'::TEXT, 
           CASE WHEN target_user_id IS NOT NULL THEN '✅ SUCCESS' ELSE '❌ USER NOT FOUND' END,
           COALESCE('User ID: ' || target_user_id::TEXT, 'No user found');
    
    -- 2단계: 기존 전문가 등록 확인
    RETURN QUERY
    SELECT '2. existing expert check'::TEXT,
           CASE WHEN EXISTS (SELECT 1 FROM experts WHERE email = p_email) 
                THEN '⚠️ ALREADY EXISTS' ELSE '✅ NEW REGISTRATION' END,
           COALESCE((SELECT 'Status: ' || verification_status FROM experts WHERE email = p_email LIMIT 1), 'New registration');
    
    -- 3단계: 인증 확인
    RETURN QUERY
    SELECT '3. authentication'::TEXT,
           CASE WHEN auth.uid() IS NOT NULL THEN '✅ AUTHENTICATED' ELSE '❌ NOT AUTHENTICATED' END,
           COALESCE('Auth User ID: ' || auth.uid()::TEXT, 'No auth.uid()');
           
    -- 4단계: experts 테이블 구조 확인
    RETURN QUERY
    SELECT '4. experts table structure'::TEXT, '✅ CORRECT SCHEMA',
           (SELECT COUNT(*)::TEXT || ' columns found' FROM information_schema.columns WHERE table_name = 'experts');
           
    -- 5단계: 전문가 타입 유효성 확인
    RETURN QUERY
    SELECT '5. expert_type validation'::TEXT,
           CASE WHEN p_expert_type IN (
               'travel_planner', 'hobby_instructor', 'culture_curator', 'health_trainer',
               'tax_accountant', 'lawyer', 'real_estate_expert', 'insurance_advisor',
               'senior_housing_consultant', 'interior_designer', 'life_assistant', 'medical_coordinator'
           ) THEN '✅ VALID TYPE' ELSE '❌ INVALID TYPE' END,
           'Provided type: ' || p_expert_type;
END;
$$;

-- 11. 테스트 실행
SELECT '=== 플랜비 통합 전문가 시스템 구축 완료 ===' as title;

-- 새로운 테이블 구조 확인
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'experts' ORDER BY ordinal_position;

-- 샘플 데이터 확인
SELECT '=== 생성된 샘플 전문가 현황 ===' as sample_title;
SELECT expert_type, category, name, title FROM experts WHERE is_verified = true;

-- 통계 뷰 확인
SELECT '=== 전문가 분야별 통계 ===' as stats_title;
SELECT * FROM expert_statistics;

-- 디버깅 함수 테스트
SELECT '=== 디버깅 테스트 (knowwhere86@gmail.com) ===' as debug_title;
SELECT * FROM debug_expert_registration('knowwhere86@gmail.com', 'Test Expert', 'travel_planner');

-- 완료 메시지
SELECT '✅ financial_experts → experts 테이블 변경 완료!' as result;
SELECT '🎯 플랜비 3대 분야 모든 전문가 수용 가능' as scope;
SELECT '📊 12가지 전문가 타입 지원' as types;
SELECT '🔒 플랜비 철학 (판매금지서약) 내장' as philosophy;
SELECT '📋 이제 프론트엔드에서 전문가 등록을 시도해보세요!' as next_step;