const { test, expect } = require('@playwright/test');

test('페이지 내용 디버깅', async ({ page }) => {
  await page.goto('http://localhost:8000');
  
  // 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 모든 버튼 텍스트 확인
  const buttons = await page.locator('button').all();
  console.log('버튼 개수:', buttons.length);
  
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`버튼 ${i+1}:`, text?.trim());
  }
  
  // 모든 링크 텍스트 확인
  const links = await page.locator('a').all();
  console.log('링크 개수:', links.length);
  
  for (let i = 0; i < Math.min(links.length, 10); i++) {
    const text = await links[i].textContent();
    if (text?.includes('계산')) {
      console.log(`링크 ${i+1} (계산 포함):`, text?.trim());
    }
  }
  
  // '계산' 포함된 모든 텍스트 찾기
  const calcTexts = await page.locator('*:has-text("계산")').all();
  console.log('계산 포함 엘리먼트 개수:', calcTexts.length);
  
  for (let i = 0; i < Math.min(calcTexts.length, 5); i++) {
    const text = await calcTexts[i].textContent();
    console.log(`계산 포함 텍스트 ${i+1}:`, text?.trim().substring(0, 100));
  }
});