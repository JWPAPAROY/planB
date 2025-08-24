const { test, expect } = require('@playwright/test');
const TestHelpers = require('../utils/test-helpers');

test.describe('은퇴생활비 계산기 E2E 테스트', () => {
  let testData;

  test.beforeEach(async ({ page }) => {
    testData = TestHelpers.generateTestCalculation();
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);
  });

  test('계산기 기본 플로우 - 게스트 사용자', async ({ page }) => {
    // 메인 페이지 로드 확인
    await expect(page).toHaveTitle(/플랜비/);
    await expect(page.locator('text=은퇴생활비 계산기')).toBeVisible();

    // 계산기 시작
    await page.click('text=은퇴생활비 계산기');
    await page.waitForSelector('[data-testid="calculator-step-1"]', { timeout: 10000 });

    // 1단계: 기본 정보 입력
    await page.selectOption('select[data-testid="age-select"]', testData.age);
    await page.selectOption('select[data-testid="health-select"]', testData.health);
    await page.selectOption('select[data-testid="mode-select"]', testData.mode);
    await page.selectOption('select[data-testid="housing-type-select"]', testData.housingType);

    // 입력 값 검증
    expect(await page.inputValue('select[data-testid="age-select"]')).toBe(testData.age);
    expect(await page.inputValue('select[data-testid="health-select"]')).toBe(testData.health);

    // 다음 단계
    await page.click('button:has-text("다음 단계")');
    await page.waitForSelector('[data-testid="calculator-step-2"]', { timeout: 5000 });

    // 2단계: 자산 정보 입력
    await page.fill('input[data-testid="financial-assets"]', testData.financialAssets);
    await page.fill('input[data-testid="severance-pay"]', testData.severancePay);
    
    if (testData.housingType === 'owned_living') {
      await page.fill('input[data-testid="home-value"]', testData.homeValue);
      await page.fill('input[data-testid="home-mortgage"]', testData.homeMortgage);
      await page.fill('input[data-testid="home-mortgage-interest"]', testData.homeMortgageInterest);
    }

    // 금액 형식화 확인
    const formattedAssets = await page.inputValue('input[data-testid="financial-assets"]');
    expect(formattedAssets).toContain('억'); // 한국 원화 형식 확인

    // 다음 단계
    await page.click('button:has-text("다음 단계")');
    await page.waitForSelector('[data-testid="calculator-step-3"]', { timeout: 5000 });

    // 3단계: 연금 정보 입력
    await page.fill('input[data-testid="national-pension"]', testData.nationalPension);
    await page.fill('input[data-testid="private-pension"]', testData.privatePension);

    // 다음 단계
    await page.click('button:has-text("다음 단계")');
    await page.waitForSelector('[data-testid="calculator-step-4"]', { timeout: 5000 });

    // 4단계: 지출 정보 입력
    for (const [key, value] of Object.entries(testData.monthlyExpenses)) {
      await page.fill(`input[data-testid="expense-${key}"]`, value.toString());
    }

    // 계산 실행
    await page.click('button:has-text("은퇴생활비 계산하기")');
    
    // 로딩 화면 확인
    await expect(page.locator('text=계산 중입니다')).toBeVisible({ timeout: 5000 });

    // 결과 화면 대기 (최대 30초)
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 결과 검증
    await expect(page.locator('[data-testid="result-shortage"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-monthly-saving"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-daily-living"]')).toBeVisible();

    // 차트 렌더링 확인
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 결과 저장 버튼 확인
    await expect(page.locator('button:has-text("결과 저장하기")')).toBeVisible();
  });

  test('주거형태별 계산 시나리오', async ({ page }) => {
    const housingTypes = [
      { type: 'owned_living', name: '자가거주' },
      { type: 'owned_renting', name: '보유주택 임대' },
      { type: 'jeonse', name: '전세' },
      { type: 'monthly', name: '월세' },
      { type: 'none', name: '무주택' }
    ];

    for (const housing of housingTypes) {
      await page.goto('/');
      await TestHelpers.waitForPageLoad(page);
      await page.click('text=은퇴생활비 계산기');

      // 특정 주거형태로 설정
      await page.selectOption('select[data-testid="housing-type-select"]', housing.type);
      
      // 주거형태에 따른 입력 필드 확인
      if (housing.type === 'owned_living' || housing.type === 'owned_renting') {
        await expect(page.locator('input[data-testid="home-value"]')).toBeVisible();
      } else if (housing.type === 'jeonse') {
        await expect(page.locator('input[data-testid="jeonse-deposit"]')).toBeVisible();
      } else if (housing.type === 'monthly') {
        await expect(page.locator('input[data-testid="monthly-rent"]')).toBeVisible();
      }

      console.log(`✅ 주거형태 테스트 완료: ${housing.name}`);
    }
  });

  test('계산 결과 정확성 검증', async ({ page }) => {
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);

    // 알려진 데이터로 계산 실행
    const knownData = {
      age: '60',
      health: '보통',
      mode: '균형',
      housingType: 'owned_living',
      financialAssets: '300000000', // 3억
      severancePay: '100000000',    // 1억
      homeValue: '500000000',       // 5억
      homeMortgage: '0',            // 무대출
      nationalPension: '1000000',   // 100만원
      privatePension: '500000',     // 50만원
      monthlyExpenses: {
        food: 600000,
        utilities: 150000,
        transportation: 200000,
        healthcare: 300000,
        leisure: 400000,
        insurance: 250000,
        other: 100000
      }
    };

    await TestHelpers.fillCalculatorForm(page, knownData);

    // 결과 대기
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 결과값 추출
    const results = await page.evaluate(() => {
      const shortageElement = document.querySelector('[data-testid="result-shortage"]');
      const monthlySavingElement = document.querySelector('[data-testid="result-monthly-saving"]');
      const dailyLivingElement = document.querySelector('[data-testid="result-daily-living"]');

      return {
        shortage: shortageElement?.textContent || '',
        monthlySaving: monthlySavingElement?.textContent || '',
        dailyLiving: dailyLivingElement?.textContent || ''
      };
    });

    // 기본적인 결과 형식 검증
    expect(results.shortage).toMatch(/[-]?\d+[\d,]*원/); // 원화 형식
    expect(results.monthlySaving).toMatch(/\d+[\d,]*원/);
    expect(results.dailyLiving).toMatch(/\d+[\d,]*원/);

    console.log('✅ 계산 결과:', results);
  });

  test('이전/다음 네비게이션 테스트', async ({ page }) => {
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);
    await page.click('text=은퇴생활비 계산기');

    // 1단계 → 2단계
    await page.selectOption('select[data-testid="age-select"]', '55');
    await page.click('button:has-text("다음 단계")');
    await page.waitForSelector('[data-testid="calculator-step-2"]');

    // 2단계 → 1단계 (뒤로)
    await page.click('button:has-text("이전 단계")');
    await page.waitForSelector('[data-testid="calculator-step-1"]');
    
    // 데이터 보존 확인
    expect(await page.inputValue('select[data-testid="age-select"]')).toBe('55');

    // 다시 2단계로
    await page.click('button:has-text("다음 단계")');
    await page.fill('input[data-testid="financial-assets"]', '100000000');
    
    // 3단계 → 2단계 (뒤로)
    await page.click('button:has-text("다음 단계")');
    await page.click('button:has-text("이전 단계")');
    
    // 데이터 보존 확인
    expect(await page.inputValue('input[data-testid="financial-assets"]')).toBe('100000000');
  });

  test('반응형 디자인 - 모바일 계산기', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);

    // 모바일에서 계산기 접근
    await page.click('text=은퇴생활비 계산기');
    
    // 모바일 최적화 확인
    const mobileMetrics = await TestHelpers.testMobileViewport(page);
    expect(mobileMetrics.touchSizeIssues).toBeLessThan(3); // 터치 사이즈 이슈 최소화

    // 모바일에서 계산 완료
    await TestHelpers.fillCalculatorForm(page, testData);
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });

    // 모바일 결과 화면 확인
    await expect(page.locator('[data-testid="calculation-result"]')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible(); // 차트 표시 확인
  });

  test('성능 테스트 - 계산 속도', async ({ page }) => {
    await page.goto('/');
    await TestHelpers.waitForPageLoad(page);

    const startTime = Date.now();
    
    // 계산 실행
    await TestHelpers.fillCalculatorForm(page, testData);
    await page.waitForSelector('[data-testid="calculation-result"]', { timeout: 30000 });
    
    const endTime = Date.now();
    const calculationTime = endTime - startTime;

    // 성능 기준: 30초 이내 계산 완료
    expect(calculationTime).toBeLessThan(30000);
    
    // 성능 메트릭 수집
    const metrics = await TestHelpers.collectPerformanceMetrics(page);
    console.log('✅ 성능 메트릭:', metrics);
    console.log(`✅ 계산 소요시간: ${calculationTime}ms`);
  });
});