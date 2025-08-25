const { test } = require('@playwright/test');

test.describe('전문가 시스템 UI 구조 디버깅', () => {
  test('전문가 시스템 실제 UI 구조 분석', async ({ page }) => {
    console.log('\n=== 전문가 시스템 UI 구조 분석 시작 ===\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('페이지 제목:', title);
    
    // 메인 페이지 구조 분석
    console.log('\n--- 메인 페이지 버튼들 ---');
    const buttons = await page.locator('button').allTextContents();
    buttons.forEach((text, i) => {
      if (text.trim()) console.log(`Button ${i}: "${text}"`);
    });
    
    const links = await page.locator('a').allTextContents();
    links.forEach((text, i) => {
      if (text.trim()) console.log(`Link ${i}: "${text}"`);
    });
    
    // 전문가 상담 관련 요소 찾기
    console.log('\n--- 전문가 상담 관련 요소 검색 ---');
    const expertElements = await page.locator('text=/전문가|상담|컨설팅/i').allTextContents();
    expertElements.forEach((text, i) => {
      console.log(`Expert element ${i}: "${text}"`);
    });
    
    // 네비게이션 메뉴 확인
    console.log('\n--- 네비게이션 메뉴 ---');
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      const navItems = await nav.locator('*').allTextContents();
      navItems.forEach((text, i) => {
        if (text.trim()) console.log(`Nav ${i}: "${text}"`);
      });
    }
    
    // 게스트 모드로 진입
    console.log('\n--- 게스트 모드 진입 ---');
    const guestButton = page.locator('text=🧮 게스트로 이용해보기');
    if (await guestButton.isVisible()) {
      await guestButton.click();
      await page.waitForTimeout(3000);
      
      console.log('게스트 모드 진입 후 화면:');
      const afterGuestButtons = await page.locator('button').allTextContents();
      afterGuestButtons.forEach((text, i) => {
        if (text.trim()) console.log(`After Guest Button ${i}: "${text}"`);
      });
      
      // 전문가 관련 카드나 메뉴 찾기
      const cards = await page.locator('h3, .card-title, [class*="card"]').allTextContents();
      cards.forEach((text, i) => {
        if (text.trim()) console.log(`Card/Section ${i}: "${text}"`);
      });
    }
    
    // 상단 네비게이션이나 메뉴 확인
    console.log('\n--- 상단 메뉴 확인 ---');
    const topMenu = await page.locator('header, .header, .nav, .navbar').allTextContents();
    topMenu.forEach((text, i) => {
      if (text.trim()) console.log(`Header/Nav ${i}: "${text}"`);
    });
    
    // 전체 페이지 HTML 구조의 주요 섹션들 확인
    console.log('\n--- 주요 섹션들 ---');
    const sections = await page.locator('section, div[class*="section"], main, article').allTextContents();
    sections.slice(0, 10).forEach((text, i) => {
      const truncated = text.trim().substring(0, 50);
      if (truncated) console.log(`Section ${i}: "${truncated}..."`);
    });
    
    console.log('\n=== 전문가 시스템 UI 구조 분석 완료 ===\n');
  });
});