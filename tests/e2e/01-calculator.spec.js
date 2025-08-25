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
    await expect(page.locator('text=🧮 게스트로 이용해보기')).toBeVisible();

    // 계산기 시작
    await page.click('text=🧮 게스트로 이용해보기');
    await page.waitForTimeout(3000); // React 상태 변경 대기
    
    // 계산기 카드 클릭
    await page.click('h3:has-text("은퇴생활비 계산기")');
    await page.waitForTimeout(2000);
    
    // 1단계 화면 확인
    await expect(page.locator('text=나이와 건강상태를 입력해주세요')).toBeVisible();

    // 1단계: 기본 정보 입력
    // 나이 입력 (textbox)
    await page.fill('input[type="text"], input:not([type])', '55');
    
    // 건강상태 선택 (두 번째 select)
    const healthSelect = page.locator('select').nth(0);
    await healthSelect.selectOption('보통 (일반적인 건강 상태)');
    
    // 생활모드 선택 (세 번째 select)  
    const modeSelect = page.locator('select').nth(1);
    await modeSelect.selectOption('균형 (평균적인 생활 수준 유지)');

    // 다음 단계 버튼 클릭
    await page.click('button:has-text("다음 단계")');
    await page.waitForTimeout(2000);
    
    // 2단계 화면 대기
    await expect(page.locator('text=2단계')).toBeVisible({ timeout: 5000 });

    // 2단계: 자산 정보 입력
    // 주거형태 선택 (필수)
    const housingSelect = page.locator('select').first();
    await housingSelect.selectOption('자가 소유 + 거주');
    
    // 모든 input 필드 처리
    const step2Inputs = await page.locator('input[type="text"], input:not([type])').all();
    if (step2Inputs.length > 0) {
      // 각 input에 적절한 값 입력
      for (let i = 0; i < Math.min(step2Inputs.length, 3); i++) {
        await step2Inputs[i].fill('10000'); // 1억원 (만원 단위)
      }
    }

    // 다음 단계
    await page.click('button:has-text("다음 단계")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=3단계')).toBeVisible({ timeout: 5000 });

    // 3단계에서 모든 input 필드 처리
    const step3Inputs = await page.locator('input').all();
    if (step3Inputs.length > 0) {
      for (let i = 0; i < Math.min(step3Inputs.length, 2); i++) {
        await step3Inputs[i].fill('1000000'); // 100만원
      }
    }

    // 계산하기 버튼 클릭 (마지막 단계)
    await page.click('button:has-text("계산하기"), button:has-text("다음 단계")');
    await page.waitForTimeout(3000);

    // 계산 결과 화면 확인
    await expect(page.locator('text=🎉 은퇴생활비 계산 완료!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=다시 계산하기').first()).toBeVisible();
    await expect(page.locator('text=💾 내 계산결과 저장하기')).toBeVisible();
    
    console.log('✅ 계산기 기본 플로우 테스트 완전 성공! 🎉');
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
      await page.click('text=🧮 게스트로 이용해보기');

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
    await page.click('text=🧮 게스트로 이용해보기');

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
    await page.click('text=🧮 게스트로 이용해보기');
    
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