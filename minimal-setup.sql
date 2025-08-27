-- ================================
-- 플랜비 최소 설정 (Supabase용)
-- Supabase는 기본 extension들이 이미 활성화되어 있음
-- ================================

-- 참고: Supabase에서 기본 제공되는 extension들
-- ✅ uuid-ossp (UUID 생성)
-- ✅ pgcrypto (암호화)  
-- ✅ auth (인증)
-- ✅ storage (파일 저장)
-- ✅ realtime (실시간 구독)

-- 따라서 아무 SQL도 실행하지 않아도 플랜비 앱이 정상 작동합니다!

SELECT 'Supabase 기본 설정으로 플랜비 사용 가능! 🚀' as message;
SELECT 'extension 활성화 불필요 - 이미 모두 활성화됨' as info;