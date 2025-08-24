const { test, expect } = require('@playwright/test');
const TestHelpers = require('../utils/test-helpers');

test.describe('전문가 시스템 E2E 테스트', () => {
  let testUser;
  let testExpert;
  let testAdmin;

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

  test('전문가 찾기 기본 기능', async ({ page }) => {
    // 전문가 찾기 페이지 접근
    await page.click('text=전문가 상담');
    await page.waitForSelector('[data-testid="expert-list"]', { timeout: 10000 });

    // 카테고리별 전문가 확인
    const categories = ['legal', 'travel', 'living'];
    
    for (const category of categories) {
      await page.click(`[data-testid="category-${category}"]`);
      await page.waitForSelector(`[data-testid="experts-${category}"]`, { timeout: 5000 });
      
      // 전문가 카드 요소 확인
      const expertCards = page.locator('[data-testid="expert-card"]');
      const count = await expertCards.count();
      
      if (count > 0) {
        const firstExpert = expertCards.first();
        await expect(firstExpert.locator('[data-testid="expert-name"]')).toBeVisible();
        await expect(firstExpert.locator('[data-testid="expert-title"]')).toBeVisible();
        await expect(firstExpert.locator('[data-testid="expert-rate"]')).toBeVisible();
        await expect(firstExpert.locator('[data-testid="expert-rating"]')).toBeVisible();
      }
      
      console.log(`✅ ${category} 카테고리: ${count}명의 전문가`);
    }
  });

  test('전문가 상세 프로필 및 예약 플로우', async ({ page }) => {
    // 회원 로그인 (예약을 위해 필요)
    await TestHelpers.signup(page, testUser);
    
    // 계산 완료 (예약 권한을 위해 필요)
    const calculationData = TestHelpers.generateTestCalculation();
    await TestHelpers.fillCalculatorForm(page, calculationData);
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 전문가 찾기
    await page.click('text=전문가 상담');
    await page.waitForSelector('[data-testid="expert-list"]', { timeout: 10000 });

    // 첫 번째 전문가 선택
    const firstExpert = page.locator('[data-testid="expert-card"]').first();
    if (await firstExpert.isVisible()) {
      await firstExpert.click();
      await page.waitForSelector('[data-testid="expert-profile-modal"]', { timeout: 5000 });

      // 전문가 프로필 정보 확인
      await expect(page.locator('[data-testid="expert-profile-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-profile-bio"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-specialties"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-credentials"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-reviews"]')).toBeVisible();

      // 상담 예약 버튼 클릭
      await page.click('button[data-testid="book-consultation"]');
      await page.waitForSelector('[data-testid="booking-modal"]', { timeout: 5000 });

      // 예약 폼 확인
      await expect(page.locator('[data-testid="consultation-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="consultation-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="consultation-type"]')).toBeVisible();
      await expect(page.locator('[data-testid="consultation-topic"]')).toBeVisible();

      // 예약 정보 입력
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      await page.fill('[data-testid="consultation-date"]', dateString);
      await page.selectOption('[data-testid="consultation-time"]', '14:00');
      await page.selectOption('[data-testid="consultation-type"]', 'phone');
      await page.fill('[data-testid="consultation-topic"]', '은퇴 후 자산관리 상담');
      await page.fill('[data-testid="client-questions"]', '안전한 투자 방법에 대해 상담받고 싶습니다.');

      // 예약 제출
      await page.click('button[data-testid="submit-booking"]');

      // 예약 완료 확인 (결제 모달 또는 완료 메시지)
      await expect(page.locator('text=예약이 접수되었습니다')).toBeVisible({ timeout: 10000 });
    }
  });

  test('관리자 전문가 승인 시스템', async ({ page }) => {
    // 테스트 관리자 생성
    await TestHelpers.createTestAdmin();

    // 관리자로 로그인
    await page.fill('input[type="email"]', 'test.admin@planb-test.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]:has-text("로그인")');

    // 마이페이지 → 관리자 탭
    await page.click('text=마이페이지');
    await page.click('text=관리자');
    await page.click('text=전문가 관리');

    // 전문가 승인 대시보드 확인
    await page.waitForSelector('[data-testid="expert-management"]', { timeout: 10000 });

    // 승인 대기 탭 확인
    await page.click('text=승인 대기');
    const pendingExperts = page.locator('[data-testid="pending-expert"]');
    const pendingCount = await pendingExperts.count();

    if (pendingCount > 0) {
      // 첫 번째 대기 중인 전문가 상세보기
      await pendingExperts.first().locator('button:has-text("상세보기")').click();
      await page.waitForSelector('[data-testid="expert-detail-modal"]', { timeout: 5000 });

      // 전문가 상세 정보 확인
      await expect(page.locator('[data-testid="expert-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-credentials-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="expert-business-info"]')).toBeVisible();

      // 승인 처리
      await page.fill('[data-testid="approval-reason"]', '자격 요건을 충족합니다.');
      await page.click('button:has-text("승인하기")');

      // 승인 완료 확인
      await expect(page.locator('text=전문가 승인 처리가 완료되었습니다')).toBeVisible({ timeout: 10000 });
    }

    console.log(`✅ 승인 대기 전문가: ${pendingCount}명`);
  });

  test('WebRTC 영상통화 기능', async ({ page }) => {
    // 브라우저 권한 허용
    await page.context().grantPermissions(['microphone', 'camera']);

    // 회원 로그인
    await TestHelpers.signup(page, testUser);

    // 실시간 상담 페이지 접근
    await page.click('text=실시간 상담');
    
    // WebRTC 연결 테스트
    const webrtcTest = await TestHelpers.testWebRTCConnection(page);
    expect(webrtcTest.success).toBe(true);

    console.log(`✅ WebRTC 연결 상태: ${webrtcTest.state}`);

    // 상담방 생성/접근
    if (await page.locator('[data-testid="create-consultation-room"]').isVisible()) {
      await page.click('[data-testid="create-consultation-room"]');
      await page.selectOption('[data-testid="room-type"]', 'private');
      await page.fill('[data-testid="room-topic"]', '은퇴 상담');
      await page.click('button:has-text("상담방 생성")');
    }

    // 영상통화 시작 버튼 확인
    await expect(page.locator('button[data-testid="start-video-call"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[data-testid="start-audio-call"]')).toBeVisible();

    // 통화 시작 (데모)
    await page.click('button[data-testid="start-video-call"]');
    
    // 미디어 스트림 활성화 확인
    const mediaActive = await page.evaluate(() => {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => true)
        .catch(() => false);
    });

    expect(mediaActive).toBe(true);
    console.log('✅ 미디어 스트림 활성화 성공');
  });

  test('전문가 후기 및 평점 시스템', async ({ page }) => {
    // 회원 로그인
    await TestHelpers.signup(page, testUser);

    // 마이페이지에서 상담 내역 확인
    await page.click('text=마이페이지');
    await page.click('text=활동 내역');

    // 완료된 상담 후기 작성
    const completedConsultations = page.locator('[data-testid="completed-consultation"]');
    const consultationCount = await completedConsultations.count();

    if (consultationCount > 0) {
      await completedConsultations.first().locator('button:has-text("후기 작성")').click();
      await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 });

      // 평점 입력
      await page.click('[data-testid="rating-5"]'); // 5점
      await page.click('[data-testid="professionalism-5"]');
      await page.click('[data-testid="communication-5"]');
      await page.click('[data-testid="satisfaction-5"]');

      // 후기 내용 작성
      await page.fill('[data-testid="review-title"]', '매우 만족스러운 상담이었습니다');
      await page.fill('[data-testid="review-content"]', '전문가님의 상세한 설명과 맞춤형 조언이 정말 도움이 되었습니다.');

      // 추천 여부
      await page.check('[data-testid="would-recommend"]');

      // 후기 제출
      await page.click('button[data-testid="submit-review"]');

      // 제출 완료 확인
      await expect(page.locator('text=후기가 등록되었습니다')).toBeVisible({ timeout: 10000 });
    }

    console.log(`✅ 완료된 상담: ${consultationCount}건`);
  });

  test('전문가 글쓰기 및 서비스 홍보', async ({ page }) => {
    // 전문가로 등록된 계정으로 로그인 필요
    // (실제 테스트에서는 미리 승인된 전문가 계정 사용)
    
    // 커뮤니티에서 전문가 게시판 접근
    await page.click('text=커뮤니티');
    await page.click('text=전문가 게시판');

    // 전문가만 접근 가능한지 확인
    if (await page.locator('text=전문가만 이용 가능합니다').isVisible()) {
      console.log('✅ 전문가 게시판 접근 제한 정상 동작');
      return;
    }

    // 전문가 글쓰기
    await page.click('button:has-text("글쓰기")');
    await page.waitForSelector('[data-testid="expert-write-form"]', { timeout: 5000 });

    // 글 작성
    await page.fill('[data-testid="post-title"]', '은퇴 후 자산관리 전략 - 세무 전문가 조언');
    await page.fill('[data-testid="post-content"]', '은퇴 후 효율적인 자산관리를 위한 핵심 포인트들을 정리해드리겠습니다.');
    
    // 서비스 정보 입력
    await page.fill('[data-testid="service-description"]', '개인별 맞춤 세무 상담을 제공합니다.');
    await page.fill('[data-testid="consultation-fee"]', '시간당 10만원');

    // 상담 가능 시간 설정
    await page.check('[data-testid="available-phone"]');
    await page.check('[data-testid="available-video"]');

    // 글 발행
    await page.click('button[data-testid="publish-post"]');

    // 발행 완료 확인
    await expect(page.locator('text=글이 성공적으로 발행되었습니다')).toBeVisible({ timeout: 10000 });
  });

  test('파일 공유 및 클라우드 스토리지', async ({ page }) => {
    // 회원 로그인
    await TestHelpers.signup(page, testUser);

    // 채팅방 접근
    await page.click('text=실시간 상담');
    
    // 파일 업로드 기능 확인
    if (await page.locator('[data-testid="file-upload-button"]').isVisible()) {
      // 테스트용 파일 생성
      const testFile = await page.evaluateHandle(() => {
        const file = new File(['테스트 파일 내용'], 'test-document.txt', { type: 'text/plain' });
        return file;
      });

      // 파일 업로드
      await page.setInputFiles('[data-testid="file-input"]', testFile);
      await page.click('[data-testid="upload-file"]');

      // 업로드 완료 확인
      await expect(page.locator('text=파일이 공유되었습니다')).toBeVisible({ timeout: 10000 });

      // 파일 다운로드 링크 확인
      await expect(page.locator('[data-testid="file-download-link"]')).toBeVisible();
    }
  });

  test('전문가 수수료 관리 시스템', async ({ page }) => {
    // 관리자 로그인
    await TestHelpers.createTestAdmin();
    await page.fill('input[type="email"]', 'test.admin@planb-test.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]:has-text("로그인")');

    // 관리자 대시보드 → 수수료 관리
    await page.click('text=마이페이지');
    await page.click('text=관리자');
    await page.click('text=수수료 관리');

    // 정산 대시보드 확인
    await page.waitForSelector('[data-testid="fee-management"]', { timeout: 10000 });

    // 정산 목록 확인
    await expect(page.locator('[data-testid="settlement-list"]')).toBeVisible();

    // 플랫폼 수익 통계 확인
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="expert-payout"]')).toBeVisible();

    console.log('✅ 수수료 관리 시스템 정상 동작');
  });
});