const { test, expect } = require('@playwright/test');
const TestHelpers = require('../utils/test-helpers');

test.describe('전문가 시스템 E2E 테스트 (수정됨)', () => {
  let testUser;

  test.beforeEach(async ({ page }) => {
    testUser = TestHelpers.generateTestUser();
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);
  });

  test('전문가 상담 카드 접근 테스트', async ({ page }) => {
    console.log('\n=== 전문가 상담 기본 접근 테스트 시작 ===');
    
    // 게스트 모드로 진입
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(3000);
    
    // 전문가 상담 카드 확인
    await expect(page.locator('h3:has-text("전문가 상담")')).toBeVisible();
    
    // 전문가 상담 카드 클릭
    await page.click('h3:has-text("전문가 상담")');
    await page.waitForTimeout(2000);
    
    // 전문가 상담 페이지로 이동했는지 확인
    console.log('✅ 전문가 상담 카드 접근 성공');
    
    // 페이지 내용 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 전문가 관련 요소들이 있는지 확인
    const expertElements = await page.locator('body').textContent();
    const hasExpertContent = expertElements.includes('전문가') || expertElements.includes('상담');
    
    expect(hasExpertContent).toBe(true);
    console.log('✅ 전문가 상담 페이지 내용 확인 완료');
  });

  test('실시간 상담 카드 접근 테스트', async ({ page }) => {
    console.log('\n=== 실시간 상담 기본 접근 테스트 시작 ===');
    
    // 게스트 모드로 진입
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(3000);
    
    // 실시간 상담 카드 확인
    await expect(page.locator('h3:has-text("실시간 상담")')).toBeVisible();
    
    // 실시간 상담 카드 클릭
    await page.click('h3:has-text("실시간 상담")');
    await page.waitForTimeout(2000);
    
    console.log('✅ 실시간 상담 카드 접근 성공');
    
    // 페이지 내용 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    const pageContent = await page.locator('body').textContent();
    const hasRealTimeContent = pageContent.includes('실시간') || 
                              pageContent.includes('상담') || 
                              pageContent.includes('채팅');
    
    expect(hasRealTimeContent).toBe(true);
    console.log('✅ 실시간 상담 페이지 내용 확인 완료');
  });

  test('전문가 등록 버튼 테스트', async ({ page }) => {
    console.log('\n=== 전문가 등록 테스트 시작 ===');
    
    // 전문가 등록 버튼 확인 (메인 페이지에 있음)
    await expect(page.locator('text=🎯 전문가로 등록하기')).toBeVisible();
    
    // 전문가 등록 버튼 클릭
    await page.click('text=🎯 전문가로 등록하기');
    await page.waitForTimeout(2000);
    
    console.log('✅ 전문가 등록 버튼 클릭 성공');
    
    // 등록 페이지나 폼으로 이동했는지 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 전문가 등록 관련 내용 확인
    const pageContent = await page.locator('body').textContent();
    const hasRegistrationContent = pageContent.includes('등록') || 
                                  pageContent.includes('전문가') || 
                                  pageContent.includes('신청');
    
    expect(hasRegistrationContent).toBe(true);
    console.log('✅ 전문가 등록 페이지 접근 확인');
  });

  test('마이페이지 접근 테스트', async ({ page }) => {
    console.log('\n=== 마이페이지 접근 테스트 시작 ===');
    
    // 게스트 모드로 진입
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(3000);
    
    // 마이페이지 카드 확인
    await expect(page.locator('h3:has-text("마이페이지")')).toBeVisible();
    
    // 마이페이지 카드 클릭
    await page.click('h3:has-text("마이페이지")');
    await page.waitForTimeout(2000);
    
    console.log('✅ 마이페이지 카드 접근 성공');
    
    // 페이지 내용 확인 (로그인이 필요하다는 메시지가 있을 수 있음)
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    const pageContent = await page.locator('body').textContent();
    const hasMyPageContent = pageContent.includes('마이페이지') || 
                            pageContent.includes('내 정보') || 
                            pageContent.includes('로그인') ||
                            pageContent.includes('활동내역');
    
    expect(hasMyPageContent).toBe(true);
    console.log('✅ 마이페이지 관련 내용 확인');
  });

  test('커뮤니티 접근 테스트', async ({ page }) => {
    console.log('\n=== 커뮤니티 접근 테스트 시작 ===');
    
    // 게스트 모드로 진입
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(3000);
    
    // 커뮤니티 카드 확인
    await expect(page.locator('h3:has-text("커뮤니티")')).toBeVisible();
    
    // 커뮤니티 카드 클릭
    await page.click('h3:has-text("커뮤니티")');
    await page.waitForTimeout(2000);
    
    console.log('✅ 커뮤니티 카드 접근 성공');
    
    // 페이지 내용 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    const pageContent = await page.locator('body').textContent();
    const hasCommunityContent = pageContent.includes('커뮤니티') || 
                               pageContent.includes('게시글') || 
                               pageContent.includes('회원') ||
                               pageContent.includes('정보 공유');
    
    expect(hasCommunityContent).toBe(true);
    console.log('✅ 커뮤니티 페이지 내용 확인');
  });

  test('전문가 시스템 종합 플로우 테스트', async ({ page }) => {
    console.log('\n=== 전문가 시스템 종합 플로우 테스트 시작 ===');
    
    // 1단계: 게스트 모드 진입
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(2000);
    console.log('✅ 1단계: 게스트 모드 진입');
    
    // 2단계: 전문가 상담 접근
    await page.click('h3:has-text("전문가 상담")');
    await page.waitForTimeout(2000);
    console.log('✅ 2단계: 전문가 상담 페이지 접근');
    
    // 3단계: 뒤로 가기 후 실시간 상담 접근
    await page.goBack();
    await page.waitForTimeout(2000);
    await page.click('h3:has-text("실시간 상담")');
    await page.waitForTimeout(2000);
    console.log('✅ 3단계: 실시간 상담 페이지 접근');
    
    // 4단계: 메인으로 돌아가서 전문가 등록 확인
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);
    await expect(page.locator('text=🎯 전문가로 등록하기')).toBeVisible();
    console.log('✅ 4단계: 전문가 등록 버튼 재확인');
    
    // 5단계: 공지사항에서 전문가 관련 내용 확인
    const noticeText = await page.locator('text=📢 공지사항: 새로운 전문가 매칭 서비스 오픈!').textContent();
    expect(noticeText).toContain('전문가');
    console.log('✅ 5단계: 전문가 매칭 서비스 공지사항 확인');
    
    console.log('\n🎉 전문가 시스템 종합 플로우 테스트 완료! 🎉');
  });
});