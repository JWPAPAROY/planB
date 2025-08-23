# 플랜비 Supabase 보안 설정 가이드

## 🔒 보안 이슈 해결 방안

### 1. Row Level Security (RLS) 활성화

다음 SQL을 Supabase SQL Editor에서 실행하여 RLS를 활성화하세요:

```sql
-- rls-security-policies.sql 파일의 전체 내용을 실행
```

### 2. Authentication 설정 변경

#### 📧 OTP 만료 시간 설정 (1시간 이하)

**Supabase Dashboard → Authentication → Settings:**

```
Email OTP expiry: 3600 seconds (1 hour) → 1800 seconds (30 minutes)
```

**또는 API를 통해 설정:**
```javascript
const { data, error } = await supabase.auth.admin.updateUser(
  userId,
  { 
    email_confirm_token_expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30분
  }
)
```

#### 🛡️ HaveIBeenPwned 비밀번호 검사 활성화

**Supabase Dashboard → Authentication → Settings → Security:**

1. **"Password strength"** 섹션으로 이동
2. **"Enable HaveIBeenPwned integration"** 체크박스 활성화
3. **"Minimum password strength"** 설정:
   - Fair (권장)
   - Good (더 강력한 보안)

**또는 프로젝트 설정에서:**
```json
{
  "auth": {
    "password_requirements": {
      "min_length": 8,
      "require_special_chars": true,
      "require_numbers": true,
      "require_uppercase": true,
      "check_hibp": true
    }
  }
}
```

### 3. 추가 보안 강화 조치

#### 🔐 JWT 토큰 보안

**JWT Secret 교체 (권장):**
```bash
# Supabase CLI를 통한 JWT 시크릿 재생성
supabase secrets set JWT_SECRET="새로운_매우_강력한_시크릿_키"
```

**JWT 만료 시간 단축:**
```json
{
  "auth": {
    "jwt_expiry": 3600  # 1시간 (기본: 1주일)
  }
}
```

#### 🌐 CORS 설정 강화

```javascript
// Supabase 프로젝트 설정에서 허용할 도메인만 명시
const allowedOrigins = [
  'https://jwpaparoy.github.io',
  'https://planb.co.kr',  // 커스텀 도메인
  'http://localhost:3000'  // 개발용 (배포시 제거)
];
```

#### 🔍 실시간 모니터링 설정

**Supabase Dashboard → Logs:**
1. **Auth logs** 모니터링 활성화
2. **Database logs** 활성화  
3. **Realtime logs** 활성화

**중요 이벤트 알림 설정:**
- 관리자 로그인
- 대량 데이터 접근
- RLS 정책 위반 시도
- 비정상적인 API 호출 패턴

### 4. 애플리케이션 레벨 보안

#### 📝 민감한 정보 로깅 방지

```javascript
// 기존 코드에서 개인정보 로깅 제거
console.log('사용자 정보:', user.email);  // ❌ 제거 필요
console.log('사용자 로그인 성공');        // ✅ 안전한 로깅
```

#### 🛡️ 입력값 검증 강화

```javascript
// 사용자 입력 검증 함수 추가
const validateUserInput = (input, type) => {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case 'phone':
      return /^010-\d{4}-\d{4}$/.test(input);
    case 'businessNumber':
      return /^\d{3}-\d{2}-\d{5}$/.test(input);
    default:
      return input.length > 0 && input.length < 1000;
  }
};
```

#### 🔒 세션 보안 강화

```javascript
// 세션 타임아웃 설정
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

// 비활성 시간 체크
let lastActivity = Date.now();
const checkInactivity = () => {
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    // 자동 로그아웃
    handleLogout();
    showNotification('보안', '세션이 만료되어 로그아웃되었습니다.', 'warning');
  }
};
```

### 5. 보안 검증 체크리스트

#### ✅ RLS 정책 확인
```sql
-- 모든 테이블의 RLS 상태 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'user_calculations', 'user_expenses',
    'community_posts', 'community_replies', 'guest_calculations'
  );
```

#### ✅ 정책 테스트
```sql
-- 각 사용자 역할별로 데이터 접근 테스트
-- 1. 게스트 사용자
-- 2. 일반 회원  
-- 3. 전문가 회원
-- 4. 관리자
```

#### ✅ 인증 설정 확인
- [ ] OTP 만료시간 1시간 이하 설정
- [ ] HaveIBeenPwned 통합 활성화
- [ ] 비밀번호 강도 요구사항 설정
- [ ] CORS 허용 도메인 제한

#### ✅ 모니터링 설정
- [ ] 인증 로그 모니터링
- [ ] 데이터베이스 접근 로그
- [ ] 비정상적인 패턴 감지 알림

### 6. 정기 보안 점검 (월 1회)

1. **접근 로그 검토**
2. **RLS 정책 효과성 확인**  
3. **사용하지 않는 계정 정리**
4. **JWT 토큰 교체 (분기별)**
5. **Supabase 보안 업데이트 확인**

---

## 🚨 즉시 조치 필요 사항

### 우선순위 1 (긴급)
1. **RLS 활성화**: `rls-security-policies.sql` 실행
2. **OTP 만료시간**: 30분으로 단축
3. **HaveIBeenPwned**: 즉시 활성화

### 우선순위 2 (중요)
1. **관리자 계정 2FA** 설정
2. **민감 정보 로깅** 제거
3. **세션 타임아웃** 구현

### 우선순위 3 (권장)
1. **실시간 모니터링** 설정
2. **정기 보안 점검** 일정 수립
3. **보안 문서화** 완료

---

**⚠️ 주의사항:**
- 모든 보안 설정 변경 전에 백업 수행
- 프로덕션 환경에서는 테스트 후 단계적 적용
- 사용자 영향을 최소화하는 점진적 배포 권장