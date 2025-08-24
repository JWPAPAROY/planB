const { test, expect } = require('@playwright/test');
const TestHelpers = require('../utils/test-helpers');

test.describe('사용자 인증 E2E 테스트', () => {
  let testUser;
  let testExpert;

  test.beforeEach(async ({ page }) => {
    testUser = TestHelpers.generateTestUser();
    testExpert = TestHelpers.generateTestExpert();
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);
  });

  test.afterAll(async () => {
    // 테스트 데이터 정리
    await TestHelpers.cleanupTestData();
  });

  test('회원가입 플로우 - 일반 사용자', async ({ page }) => {
    // 회원가입 버튼 클릭
    await page.click('button:has-text("회원가입")');
    await page.waitForSelector('form[data-testid="signup-form"]', { timeout: 10000 });

    // 회원가입 폼 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[data-testid="confirm-password"]')).toBeVisible();

    // 기본 정보 입력
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.fill('input[data-testid="confirm-password"]', testUser.password);

    // 닉네임 설정
    await page.check('input[type="checkbox"][data-testid="use-custom-nickname"]');
    await page.fill('input[data-testid="custom-nickname"]', testUser.nickname);

    // 개인정보 동의
    await expect(page.locator('text=개인정보 수집·이용 동의서')).toBeVisible();
    await page.check('input[type="checkbox"][data-testid="privacy-consent"]');

    // 회원가입 실행
    await page.click('button[type="submit"]:has-text("가입하기")');

    // 성공 메시지 확인
    await expect(page.locator('text=회원가입이 완료되었습니다')).toBeVisible({ timeout: 15000 });

    // 자동 로그인 확인
    await expect(page.locator(`text=안녕하세요, ${testUser.nickname}님`)).toBeVisible({ timeout: 10000 });
  });

  test('로그인/로그아웃 플로우', async ({ page }) => {
    // 먼저 회원가입
    await TestHelpers.signup(page, testUser);

    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();

    // 로그인
    await page.click('button:has-text("로그인")');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]:has-text("로그인")');

    // 로그인 성공 확인
    await expect(page.locator(`text=안녕하세요, ${testUser.nickname}님`)).toBeVisible({ timeout: 10000 });

    // 마이페이지 접근 가능 확인
    await page.click('text=마이페이지');
    await expect(page.locator('text=내 정보')).toBeVisible();
  });

  test('전문가 등록 플로우 - 3단계 완전 테스트', async ({ page }) => {
    // 전문가 등록 시작
    await page.click('text=전문가 등록');
    await page.waitForSelector('[data-testid="expert-signup-step-1"]', { timeout: 10000 });

    // 1단계: 개인정보보호 동의
    await expect(page.locator('text=개인정보 수집·이용 동의서')).toBeVisible();
    await expect(page.locator('text=전문분야, 자격증·경력정보, 사업자등록증')).toBeVisible();

    // 동의서 상세보기/간략보기 테스트
    await page.click('button:has-text("상세보기")');
    await expect(page.locator('text=개인정보보호위원회')).toBeVisible();
    await page.click('button:has-text("간략보기")');

    // 동의 및 다음 단계
    await page.check('input[type="checkbox"][data-testid="expert-privacy-consent"]');
    await page.click('button:has-text("다음 단계")');

    // 2단계: 기본 정보 입력
    await page.waitForSelector('[data-testid="expert-signup-step-2"]', { timeout: 5000 });

    // 회원가입 정보
    await page.fill('input[type="email"]', testExpert.email);
    await page.fill('input[type="password"]', testExpert.password);
    await page.fill('input[data-testid="confirm-password"]', testExpert.password);
    
    // 닉네임 설정
    await page.check('input[type="checkbox"][data-testid="use-custom-nickname"]');
    await page.fill('input[data-testid="custom-nickname"]', testExpert.nickname);

    // 전문가 기본 정보
    await page.fill('input[data-testid="expert-name"]', testExpert.nickname);
    await page.fill('input[data-testid="expert-title"]', testExpert.expertTitle);
    await page.selectOption('select[data-testid="expert-type"]', testExpert.expertType);
    await page.fill('input[data-testid="expert-experience"]', testExpert.experienceYears);

    // 연락처
    await page.fill('input[data-testid="expert-phone"]', testExpert.phone);

    // 사업자 정보
    await page.fill('input[data-testid="business-license"]', testExpert.businessLicense);
    await page.fill('input[data-testid="qualification-number"]', testExpert.qualificationNumber);

    // 다음 단계
    await page.click('button:has-text("다음 단계")');

    // 3단계: 전문가 프로필 완성
    await page.waitForSelector('[data-testid="expert-signup-step-3"]', { timeout: 5000 });

    // 자기소개
    await page.fill('textarea[data-testid="expert-bio"]', testExpert.bio);

    // 시간당 상담료
    await page.fill('input[data-testid="hourly-rate"]', testExpert.hourlyRate);

    // 전문분야 추가
    for (const specialty of testExpert.specialties) {
      await page.fill('input[data-testid="specialty-input"]', specialty);
      await page.click('button:has-text("추가")');
      await expect(page.locator(`text=${specialty}`)).toBeVisible();
    }

    // 자격증 추가
    for (const credential of testExpert.credentials) {
      await page.fill('input[data-testid="credential-input"]', credential);
      await page.click('button:has-text("추가")');
      await expect(page.locator(`text=${credential}`)).toBeVisible();
    }

    // 상담 가능 방식 선택
    for (const type of testExpert.availableTypes) {
      await page.check(`input[type="checkbox"][value="${type}"]`);
    }

    // 등록 완료
    await page.click('button:has-text("전문가 등록 완료")');

    // 등록 완료 확인
    await expect(page.locator('text=전문가 등록이 완료되었습니다')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=관리자 승인 후 서비스를 이용하실 수 있습니다')).toBeVisible();
  });

  test('권한별 접근 제한 테스트', async ({ page }) => {
    // 게스트 상태에서 제한된 기능 확인
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();

    // 커뮤니티 - 목록은 조회 가능
    await page.click('text=커뮤니티');
    await expect(page.locator('[data-testid="community-posts"]')).toBeVisible({ timeout: 10000 });

    // 게시글 상세보기 제한 확인 (계산 미완료)
    const firstPost = page.locator('[data-testid="post-item"]').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();
      await expect(page.locator('text=계산을 완료하신 후 이용해주세요')).toBeVisible({ timeout: 5000 });
    }

    // 채팅 접근 제한
    await page.click('text=실시간 상담');
    await expect(page.locator('text=계산을 완료하신 후 이용해주세요')).toBeVisible({ timeout: 5000 });

    // 회원가입 후 권한 변경 확인
    await TestHelpers.signup(page, testUser);

    // 회원은 계산 완료 후 커뮤니티 참여 가능
    const calculationData = TestHelpers.generateTestCalculation();
    await TestHelpers.fillCalculatorForm(page, calculationData);
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 이제 커뮤니티 접근 가능
    await page.click('text=커뮤니티');
    await page.click('button:has-text("글쓰기")');
    await expect(page.locator('[data-testid="write-form"]')).toBeVisible({ timeout: 5000 });
  });

  test('비밀번호 검증 테스트', async ({ page }) => {
    await page.click('button:has-text("회원가입")');

    // 약한 비밀번호 테스트
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', '123');
    await page.fill('input[data-testid="confirm-password"]', '123');

    await expect(page.locator('text=비밀번호는 8자 이상')).toBeVisible();

    // 비밀번호 불일치 테스트
    await page.fill('input[type="password"]', testUser.password);
    await page.fill('input[data-testid="confirm-password"]', 'DifferentPassword123!');

    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();

    // 올바른 비밀번호
    await page.fill('input[data-testid="confirm-password"]', testUser.password);
    await expect(page.locator('text=비밀번호가 일치합니다')).toBeVisible();
  });

  test('이메일 중복 확인 테스트', async ({ page }) => {
    // 첫 번째 사용자 등록
    await TestHelpers.signup(page, testUser);
    await page.click('button:has-text("로그아웃")');

    // 같은 이메일로 재등록 시도
    await page.click('button:has-text("회원가입")');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'NewPassword123!');
    await page.fill('input[data-testid="confirm-password"]', 'NewPassword123!');
    await page.check('input[type="checkbox"][data-testid="privacy-consent"]');

    await page.click('button[type="submit"]:has-text("가입하기")');

    // 중복 이메일 오류 확인
    await expect(page.locator('text=이미 등록된 이메일입니다')).toBeVisible({ timeout: 10000 });
  });

  test('게스트 → 회원 데이터 이관 테스트', async ({ page }) => {
    // 게스트로 계산 완료
    const calculationData = TestHelpers.generateTestCalculation();
    await TestHelpers.fillCalculatorForm(page, calculationData);
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 결과 저장 시 회원가입 유도
    await page.click('button:has-text("결과 저장하기")');
    await expect(page.locator('text=회원가입하고 결과를 저장하세요')).toBeVisible();

    // 회원가입
    await TestHelpers.signup(page, testUser);

    // 마이페이지에서 계산 결과 확인
    await page.click('text=마이페이지');
    await page.click('text=활동 내역');
    
    // 게스트 시절의 계산 결과가 이관되었는지 확인
    await expect(page.locator('[data-testid="calculation-history"]')).toBeVisible({ timeout: 5000 });
  });
});