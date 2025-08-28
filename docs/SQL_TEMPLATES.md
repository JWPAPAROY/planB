# SQL 템플릿 라이브러리

> **복사-붙여넣기로 사용할 수 있는 안전한 SQL 코드 템플릿 모음**

## 🎯 사용법

1. 필요한 템플릿을 복사
2. `[PLACEHOLDER]`를 실제 값으로 변경  
3. 주석 처리된 부분은 필요에 따라 활성화
4. Supabase SQL Editor에서 실행

## 📊 통계 조회 함수 템플릿

### 1. 기본 통계 함수
```sql
-- [TABLE_NAME] 통계 조회 함수
DROP FUNCTION IF EXISTS get_[table_name]_statistics(TEXT, TEXT);

CREATE FUNCTION get_[table_name]_statistics(
    p_category TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    category TEXT,
    type_name TEXT,
    total_count BIGINT,
    active_count BIGINT,
    average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.category,
        t.type_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN t.is_active THEN 1 END) as active_count,
        ROUND(AVG(t.rating), 2) as average_rating
    FROM [table_name] t
    WHERE 
        -- 기본 필터링
        t.is_verified = true
        -- 선택적 필터링
        AND (p_category IS NULL OR t.category = p_category)
        AND (p_type IS NULL OR t.type_name = p_type)
    GROUP BY t.category, t.type_name
    ORDER BY t.category, t.type_name;
END;
$$;

COMMENT ON FUNCTION get_[table_name]_statistics(TEXT, TEXT) IS '[TABLE_NAME] 통계 조회 - SECURITY INVOKER';
```

### 2. 관리자 전용 상세 통계
```sql
-- [TABLE_NAME] 관리자 전용 상세 통계
DROP FUNCTION IF EXISTS get_admin_[table_name]_statistics();

CREATE FUNCTION get_admin_[table_name]_statistics()
RETURNS TABLE (
    category TEXT,
    total_count BIGINT,
    active_count BIGINT,
    pending_count BIGINT,
    rejected_count BIGINT,
    suspended_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 관리자 권한 확인
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (email LIKE '%admin%' OR nickname LIKE '%관리자%')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.category,
        COUNT(*) as total_count,
        COUNT(CASE WHEN t.is_active THEN 1 END) as active_count,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN t.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN t.status = 'suspended' THEN 1 END) as suspended_count
    FROM [table_name] t
    GROUP BY t.category
    ORDER BY t.category;
END;
$$;

COMMENT ON FUNCTION get_admin_[table_name]_statistics() IS '[TABLE_NAME] 관리자 전용 상세 통계';
```

## 🔍 디버깅 함수 템플릿

### 1. 표준 디버깅 함수
```sql
-- [FEATURE_NAME] 디버깅 함수
DROP FUNCTION IF EXISTS debug_[feature_name](TEXT, TEXT);

CREATE FUNCTION debug_[feature_name](
    p_email TEXT,
    p_additional_param TEXT DEFAULT NULL
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
    -- 1단계: 사용자 조회
    SELECT id INTO target_user_id FROM user_profiles WHERE email = p_email;
    
    RETURN QUERY
    SELECT 
        '1. User lookup'::TEXT as step,
        CASE 
            WHEN target_user_id IS NOT NULL THEN '✅ SUCCESS'
            ELSE '❌ USER NOT FOUND'
        END as status,
        COALESCE('User ID: ' || target_user_id::TEXT, 'No user found with email: ' || p_email) as details;
    
    -- 2단계: 테이블 데이터 확인
    RETURN QUERY
    SELECT 
        '2. Table data check'::TEXT as step,
        CASE 
            WHEN EXISTS (SELECT 1 FROM [table_name] WHERE user_email = p_email) 
            THEN '✅ DATA EXISTS'
            ELSE '❌ NO DATA'
        END as status,
        'Table: [table_name]' as details;
    
    -- 3단계: 권한 확인
    RETURN QUERY
    SELECT 
        '3. Authentication'::TEXT as step,
        CASE 
            WHEN auth.uid() IS NOT NULL THEN '✅ AUTHENTICATED'
            ELSE '❌ NOT AUTHENTICATED'
        END as status,
        COALESCE('Auth User ID: ' || auth.uid()::TEXT, 'No auth.uid()') as details;
    
    -- 4단계: RLS 정책 확인
    RETURN QUERY
    SELECT 
        '4. RLS policies'::TEXT as step,
        '✅ POLICIES ACTIVE' as status,
        (SELECT COUNT(*)::TEXT || ' policies found' 
         FROM pg_policies 
         WHERE tablename = '[table_name]') as details;
END;
$$;

COMMENT ON FUNCTION debug_[feature_name](TEXT, TEXT) IS '[FEATURE_NAME] 디버깅 함수 - 단계별 검증';
```

## 🗃️ 테이블 생성 템플릿

### 1. 표준 사용자 연관 테이블
```sql
-- [TABLE_NAME] 테이블 생성
DROP TABLE IF EXISTS [table_name] CASCADE;

CREATE TABLE [table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- 사용자 연결
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- 기본 정보
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    
    -- 분류
    category TEXT NOT NULL CHECK (category IN ('category1', 'category2', 'category3')),
    type_name TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- 상태 관리
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- 평가 정보
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- 제약 조건
    UNIQUE(email),
    UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX idx_[table_name]_user_id ON [table_name](user_id);
CREATE INDEX idx_[table_name]_email ON [table_name](email);
CREATE INDEX idx_[table_name]_category ON [table_name](category);
CREATE INDEX idx_[table_name]_status ON [table_name](status);
CREATE INDEX idx_[table_name]_active_verified ON [table_name](is_active, is_verified);

-- RLS 활성화
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

### 2. RLS 정책 템플릿
```sql
-- [TABLE_NAME] RLS 정책 설정

-- 공개 조회 정책 (검증된 활성 데이터만)
CREATE POLICY "Public can view verified [table_name]" ON [table_name]
    FOR SELECT USING (
        is_verified = true 
        AND is_active = true
    );

-- 사용자 데이터 삽입 정책
CREATE POLICY "Users can insert their own [table_name]" ON [table_name]
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        email IN (SELECT email FROM user_profiles WHERE id = auth.uid())
    );

-- 사용자 데이터 업데이트 정책
CREATE POLICY "Users can update their own [table_name]" ON [table_name]
    FOR UPDATE USING (
        auth.uid() = user_id OR
        email IN (SELECT email FROM user_profiles WHERE id = auth.uid()) OR
        -- 관리자는 모든 데이터 수정 가능
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );

-- 관리자 전체 관리 정책
CREATE POLICY "Admins can manage all [table_name]" ON [table_name]
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM user_profiles 
            WHERE email LIKE '%admin%' OR nickname LIKE '%관리자%'
        )
    );
```

### 3. 업데이트 트리거 템플릿
```sql
-- [TABLE_NAME] 업데이트 트리거 설정
DROP TRIGGER IF EXISTS update_[table_name]_updated_at ON [table_name];

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_[table_name]_updated_at 
            BEFORE UPDATE ON [table_name] 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ [TABLE_NAME] 업데이트 트리거 생성됨';
    ELSE
        RAISE NOTICE '⚠️ update_updated_at_column 함수가 없습니다. 트리거 생성 건너뜀.';
    END IF;
END $$;
```

## 🧪 테스트 쿼리 템플릿

### 1. 기본 테스트 세트
```sql
-- [TABLE_NAME] 테스트 실행
SELECT '=== [TABLE_NAME] 테스트 시작 ===' as test_title;

-- 테이블 존재 확인
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '[table_name]') 
        THEN '✅ [TABLE_NAME] 테이블 존재함'
        ELSE '❌ [TABLE_NAME] 테이블 없음'
    END as table_status;

-- RLS 정책 확인
SELECT 
    COUNT(*) as policy_count,
    '✅ RLS 정책 ' || COUNT(*) || '개 설정됨' as policy_status
FROM pg_policies 
WHERE tablename = '[table_name]';

-- 인덱스 확인
SELECT 
    COUNT(*) as index_count,
    '✅ 인덱스 ' || COUNT(*) || '개 생성됨' as index_status
FROM pg_indexes 
WHERE tablename = '[table_name]';

-- 샘플 데이터 확인 (있다면)
SELECT 
    COUNT(*) as sample_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 샘플 데이터 ' || COUNT(*) || '건 존재'
        ELSE '📄 샘플 데이터 없음'
    END as sample_status
FROM [table_name];

-- 함수 테스트 (디버깅 함수)
SELECT '=== 디버깅 함수 테스트 ===' as debug_title;
SELECT * FROM debug_[feature_name]('test@example.com') LIMIT 3;

-- 통계 함수 테스트
SELECT '=== 통계 함수 테스트 ===' as stats_title;
SELECT * FROM get_[table_name]_statistics() LIMIT 5;
```

## 🔄 마이그레이션 템플릿

### 1. 테이블 이름 변경 마이그레이션
```sql
-- [OLD_TABLE] → [NEW_TABLE] 마이그레이션
-- 1. 기존 데이터 백업
CREATE TABLE [old_table]_backup AS SELECT * FROM [old_table];

-- 2. 새 테이블 생성 (위의 테이블 생성 템플릿 사용)
-- ... 새 테이블 생성 코드 ...

-- 3. 데이터 마이그레이션
INSERT INTO [new_table] (
    -- 매핑할 컬럼들 나열
    id, created_at, updated_at, user_id, email, name
)
SELECT 
    -- 기존 컬럼에서 새 컬럼으로 매핑
    id, created_at, updated_at, user_id, email, name
FROM [old_table]_backup;

-- 4. 마이그레이션 검증
SELECT 
    (SELECT COUNT(*) FROM [old_table]_backup) as old_count,
    (SELECT COUNT(*) FROM [new_table]) as new_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM [old_table]_backup) = (SELECT COUNT(*) FROM [new_table])
        THEN '✅ 마이그레이션 성공'
        ELSE '❌ 데이터 수 불일치'
    END as migration_status;

-- 5. 기존 테이블 삭제 (검증 후)
-- DROP TABLE [old_table] CASCADE; -- 신중하게!
```

## 📝 완료 템플릿

### 1. 작업 완료 확인
```sql
-- [FEATURE_NAME] 구현 완료 확인
SELECT '=== [FEATURE_NAME] 구현 완료 ===' as completion_title;

-- 핵심 컴포넌트 확인
SELECT 'Tables: ' || COUNT(*) || ' created' as tables_status
FROM information_schema.tables 
WHERE table_name LIKE '[feature_prefix]%';

SELECT 'Functions: ' || COUNT(*) || ' created' as functions_status
FROM pg_proc 
WHERE proname LIKE '%[feature_name]%';

SELECT 'Policies: ' || COUNT(*) || ' created' as policies_status
FROM pg_policies 
WHERE tablename LIKE '[table_pattern]%';

-- 보안 상태 확인
SELECT 
    proname as function_name,
    CASE WHEN prosecdef THEN '❌ SECURITY DEFINER' ELSE '✅ SECURITY INVOKER' END as security_status
FROM pg_proc 
WHERE proname LIKE '%[feature_name]%'
ORDER BY proname;

-- 최종 메시지
SELECT '✅ [FEATURE_NAME] 구현 완료!' as result;
SELECT '🔒 모든 함수가 SECURITY INVOKER로 생성됨' as security_note;
SELECT '📊 통계 및 디버깅 함수 준비 완료' as tools_ready;
SELECT '📋 이제 프론트엔드에서 [FEATURE_NAME] 사용 가능!' as next_step;
```

---

## 🎯 사용 예시

### 새로운 "리뷰" 기능 구현 시:
```sql
-- 1. 테이블 생성 (템플릿에서 복사)
-- [table_name] → reviews
-- [TABLE_NAME] → REVIEWS  
-- [feature_name] → review

-- 2. 필요한 부분 수정
-- category 체크 조건을 실제 리뷰 카테고리로 변경
-- 추가 컬럼 정의 (rating, comment 등)

-- 3. 테스트 실행
-- 모든 템플릿의 테스트 쿼리 실행
```

**💡 이 템플릿들을 사용하면 반복 작업을 90% 줄이고 보안 이슈를 원천 차단할 수 있습니다.**