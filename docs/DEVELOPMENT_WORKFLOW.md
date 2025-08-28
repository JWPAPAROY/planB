# 플랜비 개발 워크플로우 가이드

> **효율적이고 안전한 개발을 위한 표준 작업 흐름**

## 🎯 개발 원칙

### 1. 보안 우선 (Security First)
- 모든 데이터베이스 변경 시 보안 가이드라인 준수
- Supabase Security Advisor 경고 0개 유지
- RLS 정책 우선 설계

### 2. 일관성 유지 (Consistency)
- 네이밍 컨벤션 준수
- 코드 스타일 통일
- 문서화 동시 진행

### 3. 테스트 기반 개발
- 기능 구현 후 반드시 테스트
- 에러 케이스 사전 검토
- 롤백 계획 수립

## 🔄 표준 개발 워크플로우

### Phase 1: 계획 및 설계
```
요구사항 분석 → 데이터베이스 설계 → API 설계 → UI/UX 설계
```

#### 체크리스트
- [ ] 기존 시스템과의 호환성 검토
- [ ] 보안 요구사항 검토 
- [ ] 성능 영향도 분석
- [ ] 롤백 시나리오 계획

### Phase 2: 데이터베이스 작업
```
스키마 설계 → 테이블 생성 → RLS 정책 → 함수 생성 → 테스트
```

#### 필수 작업 순서
1. **스키마 파일 작성**
   ```sql
   -- 예: create-new-feature-schema.sql
   -- 1. 테이블 생성
   -- 2. 인덱스 생성  
   -- 3. RLS 정책 설정
   -- 4. 함수 생성 (뷰 금지!)
   -- 5. 샘플 데이터
   -- 6. 테스트 쿼리
   ```

2. **보안 가이드라인 준수**
   - `DATABASE_SECURITY_GUIDELINES.md` 참조
   - 모든 함수는 `SECURITY INVOKER`
   - 뷰 사용 금지

3. **테스트 실행**
   ```sql
   -- 각 함수별 테스트 쿼리 포함
   SELECT * FROM debug_new_feature('test@email.com');
   ```

### Phase 3: 프론트엔드 작업
```
컴포넌트 설계 → API 연동 → UI 구현 → 반응형 최적화 → 테스트
```

#### 코딩 컨벤션
- **React 컴포넌트**: PascalCase (예: `ExpertProfileComponent`)
- **함수명**: camelCase (예: `updateExpertProfile`)
- **상수**: UPPER_SNAKE_CASE (예: `EXPERT_CATEGORIES`)
- **CSS 클래스**: kebab-case, Tailwind 우선 사용

### Phase 4: 통합 테스트 및 배포
```
로컬 테스트 → 스테이징 배포 → 프로덕션 배포 → 모니터링
```

## 📁 파일 구조 및 네이밍

### SQL 파일 네이밍
```
create-[feature-name]-schema.sql       # 새 기능 스키마
fix-[issue-description].sql            # 버그 수정
update-[table-name]-[reason].sql       # 기존 테이블 수정
migrate-[from]-to-[to].sql             # 데이터 마이그레이션
```

### 문서 파일 위치
```
docs/
├── DATABASE_SECURITY_GUIDELINES.md    # 보안 가이드라인
├── DEVELOPMENT_WORKFLOW.md            # 개발 워크플로우 (이 파일)
├── API_REFERENCE.md                   # API 문서
├── SUPABASE_SETUP_GUIDE.md           # Supabase 설정 가이드
└── TROUBLESHOOTING.md                 # 문제 해결 가이드
```

## 🚨 자주 발생하는 문제 및 해결법

### 1. SECURITY DEFINER 경고
**문제**: 뷰 생성 시 보안 경고 발생
**해결**: 뷰 대신 `SECURITY INVOKER` 함수 사용

### 2. 함수 반환 타입 변경 오류
**문제**: `42P13: cannot change return type`
**해결**: 
```sql
DROP FUNCTION IF EXISTS function_name(old_params);
CREATE FUNCTION function_name(new_params) ...
```

### 3. RLS 정책 충돌
**문제**: 새 정책이 기존 정책과 충돌
**해결**:
```sql
-- 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'table_name';
-- 충돌 정책 삭제 후 재생성
DROP POLICY policy_name ON table_name;
CREATE POLICY new_policy_name ON table_name ...;
```

### 4. 테이블 이름 변경 시 참조 오류
**문제**: 기존 코드에서 옛 테이블명 참조
**해결 순서**:
1. 새 테이블 생성
2. 데이터 마이그레이션
3. 프론트엔드 코드 모든 참조 변경
4. 기존 테이블 삭제

## 🛠️ 디버깅 도구

### 1. SQL 디버깅 함수 템플릿
```sql
CREATE FUNCTION debug_[feature_name](
    p_param TEXT
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
BEGIN
    -- 단계별 검증 로직
    RETURN QUERY
    SELECT '1. Table exists check'::TEXT, 
           CASE WHEN EXISTS(...) THEN '✅ SUCCESS' ELSE '❌ FAILED' END,
           'Detail message';
    -- 추가 검증 단계들...
END;
$$;
```

### 2. 프론트엔드 디버깅
```javascript
// Supabase 쿼리 디버깅
const { data, error } = await supabase
    .from('table_name')
    .select('*');
    
if (error) {
    console.error('🚨 Supabase Error:', error);
    console.error('🔍 Query Details:', { table: 'table_name', operation: 'select' });
}
```

## ✅ 릴리스 전 체크리스트

### 데이터베이스
- [ ] Supabase Security Advisor 경고 0개
- [ ] 모든 RLS 정책 테스트 완료
- [ ] 함수 반환값 검증
- [ ] 성능 테스트 완료

### 프론트엔드  
- [ ] 모든 컴포넌트 모바일 반응형 테스트
- [ ] 에러 처리 케이스 확인
- [ ] 게스트/회원별 권한 테스트
- [ ] 브라우저 호환성 테스트

### 문서화
- [ ] CLAUDE.md 업데이트
- [ ] API 변경사항 문서화
- [ ] 새 기능 사용법 문서화

## 🔄 정기 유지보수

### 주간 작업
- Security Advisor 점검
- 성능 모니터링
- 에러 로그 분석

### 월간 작업
- 데이터베이스 최적화
- 사용하지 않는 함수/테이블 정리
- 문서 업데이트

## 📊 성과 측정

### 개발 효율성 지표
- 보안 경고 발생 횟수 (목표: 0)
- 함수 생성 실패율 (목표: <5%)
- 배포 후 롤백 횟수 (목표: 0)

### 코드 품질 지표
- 코드 재사용성
- 문서화 완성도
- 테스트 커버리지

---

**💡 이 워크플로우를 따르면 반복적인 보안 이슈나 개발 오류를 크게 줄일 수 있습니다.**