-- 보안 함수들 search_path 문제 해결
-- 2025년 8월 23일

-- 기존 함수들 삭제 후 안전한 버전으로 재생성

DROP FUNCTION IF EXISTS public.set_current_user_hash(TEXT);
DROP FUNCTION IF EXISTS public.set_current_session_id(TEXT);

-- 안전한 search_path가 설정된 함수들로 재생성

-- 현재 사용자 해시를 안전하게 설정하는 함수 (보안 강화)
CREATE OR REPLACE FUNCTION public.set_current_user_hash(user_hash TEXT)
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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, extensions;

-- 현재 세션 ID를 안전하게 설정하는 함수 (보안 강화)
CREATE OR REPLACE FUNCTION public.set_current_session_id(session_id TEXT)
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
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, extensions;

-- 함수 권한 설정 (인증된 사용자만 실행 가능)
REVOKE EXECUTE ON FUNCTION public.set_current_user_hash(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_session_id(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_current_user_hash(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_session_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_user_hash(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.set_current_session_id(TEXT) TO anon;

-- 완료 확인
SELECT 'Security functions updated with safe search_path' AS status;