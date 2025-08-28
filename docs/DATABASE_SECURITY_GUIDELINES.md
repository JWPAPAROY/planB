# 플랜비 데이터베이스 보안 가이드라인

> **중요**: Supabase Security Advisor 경고를 방지하고 안전한 데이터베이스를 구축하기 위한 필수 가이드라인

## 🚨 절대 금지 사항

### ❌ 1. 뷰(View) 사용 금지
```sql
-- 절대 사용하지 말 것 - SECURITY DEFINER 경고 발생
CREATE VIEW some_statistics AS SELECT ...
CREATE OR REPLACE VIEW user_stats AS ...
```

**이유**: PostgreSQL 뷰는 기본적으로 SECURITY DEFINER 속성을 가질 수 있으며, Supabase Security Advisor에서 보안 취약점으로 경고함.

### ❌ 2. SECURITY DEFINER 함수 생성 금지
```sql
-- 절대 사용하지 말 것
CREATE FUNCTION my_function() ... SECURITY DEFINER
```

### ❌ 3. search_path 설정 없는 함수 금지
```sql
-- 절대 사용하지 말 것 - 보안 취약점
CREATE FUNCTION my_function() ... AS $$ ... $$;
```

## ✅ 권장 사항

### 1. 안전한 함수 생성 템플릿

```sql
-- ✅ 표준 템플릿 (모든 함수는 이 패턴 사용)
DROP FUNCTION IF EXISTS function_name(parameter_types);

CREATE FUNCTION function_name(
    param1 TEXT DEFAULT NULL,
    param2 INTEGER DEFAULT 0
)
RETURNS TABLE (
    column1 TEXT,
    column2 BIGINT,
    column3 NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER                    -- 필수!
SET search_path = public, pg_temp   -- 필수!
AS $$
BEGIN
    -- 권한 체크 (필요한 경우)
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND (email LIKE '%admin%' OR nickname LIKE '%관리자%')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.column1,
        COUNT(*) as column2,
        AVG(t.some_value) as column3
    FROM some_table t
    WHERE 
        -- RLS 정책 준수
        t.is_active = true
        -- 선택적 필터링
        AND (param1 IS NULL OR t.category = param1)
    GROUP BY t.column1
    ORDER BY t.column1;
END;
$$;

-- 함수 설명 추가 (필수)
COMMENT ON FUNCTION function_name(TEXT, INTEGER) IS '함수 설명 - SECURITY INVOKER, 용도 명시';
```

### 2. 통계 조회 함수 패턴

```sql
-- 공개 통계 함수 (모든 사용자)
CREATE FUNCTION get_public_statistics()
RETURNS TABLE (category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.category,
        COUNT(*) as count
    FROM some_table t
    WHERE t.is_verified = true AND t.is_active = true
    GROUP BY t.category;
END;
$$;

-- 관리자 전용 상세 통계 함수
CREATE FUNCTION get_admin_detailed_statistics()
RETURNS TABLE (category TEXT, total BIGINT, active BIGINT, pending BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 관리자 권한 체크
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
        COUNT(*) as total,
        COUNT(CASE WHEN t.is_active THEN 1 END) as active,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending
    FROM some_table t
    GROUP BY t.category;
END;
$$;
```

## 🔄 테이블 변경 시 작업 흐름

### 1. 새 테이블 생성 시
```sql
-- 1단계: 테이블 생성
CREATE TABLE new_table (...);

-- 2단계: RLS 정책 설정
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ON new_table ...;

-- 3단계: 통계/조회 함수 생성 (뷰 아님!)
DROP FUNCTION IF EXISTS get_new_table_statistics();
CREATE FUNCTION get_new_table_statistics() ... SECURITY INVOKER ...;

-- 4단계: 함수 설명 추가
COMMENT ON FUNCTION get_new_table_statistics() IS '설명';
```

### 2. 기존 테이블 수정 시
```sql
-- 기존 함수들 먼저 삭제
DROP FUNCTION IF EXISTS old_function_name(old_params);

-- 테이블 구조 변경
ALTER TABLE existing_table ADD COLUMN new_column TEXT;

-- 새로운 시그니처로 함수 재생성
CREATE FUNCTION new_function_name(new_params) ... SECURITY INVOKER ...;
```

## 🛡️ 보안 체크리스트

### 함수 생성 전 확인사항
- [ ] `DROP FUNCTION IF EXISTS`로 기존 함수 삭제
- [ ] `SECURITY INVOKER` 명시
- [ ] `SET search_path = public, pg_temp` 설정
- [ ] 관리자 함수인 경우 권한 체크 로직 포함
- [ ] RLS 정책 준수하는 WHERE 조건
- [ ] `COMMENT ON FUNCTION` 설명 추가

### 배포 후 확인사항
- [ ] Supabase Security Advisor 경고 없음
- [ ] 함수 정상 동작 확인
- [ ] 권한 체크 로직 테스트 (해당하는 경우)

## 🚫 자주 발생하는 실수들

### 1. 함수 반환 타입 변경 시 오류
```sql
-- ❌ 오류 발생 패턴
CREATE OR REPLACE FUNCTION existing_function()
RETURNS TABLE (new_column_added TEXT) -- 기존과 다른 반환 타입
...

-- ERROR: 42P13: cannot change return type of existing function
```

**해결**: 항상 `DROP FUNCTION IF EXISTS` 먼저 실행

### 2. 뷰 의존성 오류
```sql
-- ❌ 오류 발생 패턴  
DROP TABLE some_table; -- 뷰가 참조하는 테이블 삭제
-- ERROR: cannot drop table because other objects depend on it
```

**해결**: 뷰 사용하지 않고 함수만 사용

### 3. 권한 체크 누락
```sql
-- ❌ 위험한 패턴
CREATE FUNCTION get_all_user_data() -- 권한 체크 없이 모든 데이터 노출
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY SELECT * FROM sensitive_table; -- 위험!
END;
$$;
```

**해결**: 관리자 전용 함수에는 반드시 권한 체크 추가

## 📚 참고 자료

- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Security Advisor](https://supabase.com/docs/guides/database/database-linter)

## 🔄 업데이트 이력

- **2025-08-27**: 최초 문서 작성
- **보안 이슈**: `expert_statistics` 뷰 SECURITY DEFINER 문제 해결 경험 반영

---

**⚠️ 이 가이드라인을 따르면 Supabase Security Advisor 경고를 99% 방지할 수 있습니다.**