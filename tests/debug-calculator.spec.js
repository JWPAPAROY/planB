const { test, expect } = require('@playwright/test');

test('계산기 페이지 구조 확인', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForTimeout(2000);
  
  // 게스트 버튼 클릭
  console.log('게스트 버튼 클릭...');
  await page.click('text=🧮 게스트로 이용해보기');
  
  // React 상태 변경 대기 및 계산기 카드 확인
  await page.waitForTimeout(3000);
  
  // 페이지 전체 내용 확인
  const pageContent = await page.textContent('body');
  console.log('페이지에 계산기 텍스트 있는지:', pageContent.includes('은퇴생활비 계산기'));
  
  // 계산기 관련 클릭 가능한 요소 찾기
  const clickableElements = await page.locator('[cursor="pointer"]:has-text("계산기"), button:has-text("계산"), *[role="button"]:has-text("계산")').all();
  console.log('클릭 가능한 계산기 요소:', clickableElements.length);
  
  // 계산기 제목 직접 클릭
  const calculatorTitle = page.locator('h3:has-text("은퇴생활비 계산기")');
  if (await calculatorTitle.isVisible()) {
    console.log('계산기 제목 클릭...');
    await calculatorTitle.click();
    await page.waitForTimeout(3000);
    
    // 클릭 후 상태 확인
    console.log('클릭 후 URL:', page.url());
  } else {
    // 부모 요소 클릭
    const calculatorCard = page.locator('*:has(h3:has-text("은퇴생활비 계산기"))');
    if (await calculatorCard.isVisible()) {
      console.log('계산기 카드 클릭...');
      await calculatorCard.click();
      await page.waitForTimeout(3000);
    }
  }
  
  // 모든 h1, h2, h3 확인
  const headings = await page.locator('h1, h2, h3').all();
  for (let i = 0; i < headings.length; i++) {
    const text = await headings[i].textContent();
    console.log(`제목 ${i+1}:`, text?.trim());
  }
  
  // 현재 URL 확인
  console.log('현재 URL:', page.url());
  
  // 계산기 관련 요소들 찾기
  const calculatorElements = await page.locator('*:has-text("계산")').all();
  console.log('계산 관련 요소 개수:', calculatorElements.length);
  
  for (let i = 0; i < Math.min(calculatorElements.length, 5); i++) {
    const text = await calculatorElements[i].textContent();
    console.log(`계산 요소 ${i+1}:`, text?.trim().substring(0, 100));
  }
  
  // 모든 select 요소 확인
  const selects = await page.locator('select').all();
  console.log('Select 요소 개수:', selects.length);
  
  for (let i = 0; i < selects.length; i++) {
    const id = await selects[i].getAttribute('id');
    const testId = await selects[i].getAttribute('data-testid');
    const name = await selects[i].getAttribute('name');
    console.log(`Select ${i+1}: id=${id}, data-testid=${testId}, name=${name}`);
  }
  
  // 모든 input 요소 확인
  const inputs = await page.locator('input').all();
  console.log('Input 요소 개수:', inputs.length);
  
  for (let i = 0; i < Math.min(inputs.length, 10); i++) {
    const type = await inputs[i].getAttribute('type');
    const id = await inputs[i].getAttribute('id');
    const testId = await inputs[i].getAttribute('data-testid');
    console.log(`Input ${i+1}: type=${type}, id=${id}, data-testid=${testId}`);
  }
  
  // 모든 버튼 확인
  const buttons = await page.locator('button').all();
  console.log('버튼 개수:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const testId = await buttons[i].getAttribute('data-testid');
    console.log(`버튼 ${i+1}: "${text?.trim()}", data-testid=${testId}`);
  }
});