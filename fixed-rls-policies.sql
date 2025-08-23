-- 플랜비 기본 테이블 RLS 정책 (타입 캐스팅 수정)
-- 2025년 8월 23일 생성
-- UUID/TEXT 타입 불일치 문제 해결

-- ============================================================================
-- 1. 기본 테이블들에 RLS 활성화
-- ============================================================================

-- 사용자 프로필 테이블 (있다면)
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자 계산 데이터 테이블
ALTER TABLE IF EXISTS public.user_calculations ENABLE ROW LEVEL SECURITY;

-- 사용자 지출 데이터 테이블  
ALTER TABLE IF EXISTS public.user_expenses ENABLE ROW LEVEL SECURITY;

-- 커뮤니티 게시글 테이블
ALTER TABLE IF EXISTS public.community_posts ENABLE ROW LEVEL SECURITY;

-- 커뮤니티 댓글 테이블
ALTER TABLE IF EXISTS public.community_replies ENABLE ROW LEVEL SECURITY;

-- 게스트 계산 데이터 테이블 (임시)
ALTER TABLE IF EXISTS public.guest_calculations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. user_calculations 테이블 RLS 정책
-- ============================================================================

-- 자신의 계산 데이터만 조회 가능
CREATE POLICY "Users can view own calculations" ON public.user_calculations 
FOR SELECT USING (
  -- 게스트는 세션 기반 접근
  user_hash = current_setting('app.current_user_hash', true)
  OR
  -- 인증된 사용자는 user_hash 매칭
  (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- 자신의 계산 데이터만 생성 가능
CREATE POLICY "Users can insert own calculations" ON public.user_calculations 
FOR INSERT WITH CHECK (
  user_hash = current_setting('app.current_user_hash', true)
  OR
  (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- 자신의 계산 데이터만 수정 가능
CREATE POLICY "Users can update own calculations" ON public.user_calculations 
FOR UPDATE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR
  (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- 자신의 계산 데이터만 삭제 가능
CREATE POLICY "Users can delete own calculations" ON public.user_calculations 
FOR DELETE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR
  (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- ============================================================================
-- 3. user_expenses 테이블 RLS 정책
-- ============================================================================

-- calculation_id를 통한 접근 제어
CREATE POLICY "Users can view own expenses" ON public.user_expenses 
FOR SELECT USING (
  calculation_id IN (
    SELECT id FROM public.user_calculations 
    WHERE user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- 자신의 지출 데이터만 생성 가능
CREATE POLICY "Users can insert own expenses" ON public.user_expenses 
FOR INSERT WITH CHECK (
  calculation_id IN (
    SELECT id FROM public.user_calculations 
    WHERE user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- 자신의 지출 데이터만 수정 가능
CREATE POLICY "Users can update own expenses" ON public.user_expenses 
FOR UPDATE USING (
  calculation_id IN (
    SELECT id FROM public.user_calculations 
    WHERE user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- 자신의 지출 데이터만 삭제 가능
CREATE POLICY "Users can delete own expenses" ON public.user_expenses 
FOR DELETE USING (
  calculation_id IN (
    SELECT id FROM public.user_calculations 
    WHERE user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- ============================================================================
-- 4. community_posts 테이블 RLS 정책
-- ============================================================================

-- 모든 사용자가 게시글 목록 조회 가능 (프로그레시브 접근)
CREATE POLICY "Anyone can view posts" ON public.community_posts 
FOR SELECT USING (true);

-- 인증된 사용자만 게시글 작성 가능
CREATE POLICY "Authenticated users can create posts" ON public.community_posts 
FOR INSERT WITH CHECK (
  user_hash IS NOT NULL
  AND (
    user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- 본인 게시글만 수정 가능
CREATE POLICY "Users can update own posts" ON public.community_posts 
FOR UPDATE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- 본인 게시글만 삭제 가능 (또는 관리자)
CREATE POLICY "Users can delete own posts" ON public.community_posts 
FOR DELETE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  OR (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'))
);

-- ============================================================================
-- 5. community_replies 테이블 RLS 정책
-- ============================================================================

-- 모든 사용자가 댓글 조회 가능
CREATE POLICY "Anyone can view replies" ON public.community_replies 
FOR SELECT USING (true);

-- 인증된 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can create replies" ON public.community_replies 
FOR INSERT WITH CHECK (
  user_hash IS NOT NULL
  AND (
    user_hash = current_setting('app.current_user_hash', true)
    OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  )
);

-- 본인 댓글만 수정 가능
CREATE POLICY "Users can update own replies" ON public.community_replies 
FOR UPDATE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
);

-- 본인 댓글만 삭제 가능 (또는 관리자)
CREATE POLICY "Users can delete own replies" ON public.community_replies 
FOR DELETE USING (
  user_hash = current_setting('app.current_user_hash', true)
  OR (auth.uid() IS NOT NULL AND user_hash = auth.uid()::text)
  OR (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'))
);

-- ============================================================================
-- 6. guest_calculations 테이블 RLS 정책 (임시 데이터)
-- ============================================================================

-- 자신의 세션 ID로만 접근 가능
CREATE POLICY "Session-based guest access" ON public.guest_calculations 
FOR ALL USING (
  session_id = current_setting('app.current_session_id', true)
);

-- ============================================================================
-- 7. user_profiles 테이블 RLS 정책 (타입 캐스팅 수정)
-- ============================================================================

-- user_profiles 테이블이 존재하고 id 컬럼의 타입 확인 후 정책 적용
DO $$
DECLARE
    id_data_type TEXT;
BEGIN
  -- user_profiles 테이블 존재 여부 및 id 컬럼 타입 확인
  SELECT data_type INTO id_data_type
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'id';
    
  IF id_data_type IS NOT NULL THEN
    RAISE NOTICE 'user_profiles.id column type: %', id_data_type;
    
    -- UUID 타입인 경우
    IF id_data_type = 'uuid' THEN
      -- 자신의 프로필만 조회 가능
      EXECUTE 'CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (
        id::text = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid())
      )';
      
      -- 자신의 프로필만 수정 가능  
      EXECUTE 'CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (
        id::text = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid())
      )';
      
      -- 새 사용자는 자신의 프로필만 생성 가능
      EXECUTE 'CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (
        id::text = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid())
      )';
      
      -- 자신의 프로필만 삭제 가능
      EXECUTE 'CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (
        id::text = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid())
      )';
      
    -- TEXT 타입인 경우
    ELSIF id_data_type = 'text' THEN
      -- 자신의 프로필만 조회 가능
      EXECUTE 'CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (
        id = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid()::text)
      )';
      
      -- 자신의 프로필만 수정 가능  
      EXECUTE 'CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (
        id = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid()::text)
      )';
      
      -- 새 사용자는 자신의 프로필만 생성 가능
      EXECUTE 'CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (
        id = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid()::text)
      )';
      
      -- 자신의 프로필만 삭제 가능
      EXECUTE 'CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (
        id = current_setting(''app.current_user_hash'', true)
        OR (auth.uid() IS NOT NULL AND id = auth.uid()::text)
      )';
    END IF;
    
  ELSE
    RAISE NOTICE 'user_profiles table does not exist or id column not found';
  END IF;
END $$;

-- ============================================================================
-- 8. 관리자 전체 접근 정책 (모든 테이블)
-- ============================================================================

-- 관리자는 모든 데이터에 접근 가능
CREATE POLICY "Admin full access calculations" ON public.user_calculations 
FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'));

CREATE POLICY "Admin full access expenses" ON public.user_expenses 
FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'));

CREATE POLICY "Admin full access posts" ON public.community_posts 
FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'));

CREATE POLICY "Admin full access replies" ON public.community_replies 
FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'));

CREATE POLICY "Admin full access guest" ON public.guest_calculations 
FOR ALL USING (auth.jwt() ->> 'email' IN ('admin@planb.co.kr', 'manager@planb.co.kr'));

-- user_profiles가 존재하는 경우 관리자 정책 추가
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'CREATE POLICY "Admin full access profiles" ON public.user_profiles FOR ALL USING (auth.jwt() ->> ''email'' IN (''admin@planb.co.kr'', ''manager@planb.co.kr''))';
  END IF;
END $$;

-- ============================================================================
-- 9. 보안 함수들
-- ============================================================================

-- 현재 사용자 해시를 안전하게 설정하는 함수
CREATE OR REPLACE FUNCTION set_current_user_hash(user_hash TEXT)
RETURNS void AS $$
BEGIN
  -- 해시 형식 검증 (UUID 또는 안전한 형식만 허용)
  IF user_hash IS NULL OR user_hash = '' THEN
    PERFORM set_config('app.current_user_hash', '', true);
  ELSIF user_hash ~ '^[a-f0-9-]{36}$' OR user_hash ~ '^[a-zA-Z0-9_-]{6,50}$' THEN
    PERFORM set_config('app.current_user_hash', user_hash, true);
  ELSE
    RAISE EXCEPTION 'Invalid user hash format: %', user_hash;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 세션 ID를 안전하게 설정하는 함수
CREATE OR REPLACE FUNCTION set_current_session_id(session_id TEXT)
RETURNS void AS $$
BEGIN
  -- 세션 ID 형식 검증
  IF session_id IS NULL OR session_id = '' THEN
    PERFORM set_config('app.current_session_id', '', true);
  ELSIF session_id ~ '^[a-f0-9-]{36}$' OR session_id ~ '^[a-zA-Z0-9_-]{6,50}$' THEN
    PERFORM set_config('app.current_session_id', session_id, true);
  ELSE
    RAISE EXCEPTION 'Invalid session ID format: %', session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 실행 완료 확인 및 테이블 정보 출력
-- ============================================================================

-- RLS 활성화 상태 확인
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_calculations', 'user_expenses', 'community_posts', 'community_replies', 'guest_calculations')
ORDER BY tablename;

-- 생성된 정책 개수 확인
SELECT 
  'RLS policies created successfully' AS status,
  COUNT(*) AS total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- 테이블별 정책 개수
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;