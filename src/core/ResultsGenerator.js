// 최종 결과 생성 전문 모듈 (기존 로직 완전 보존)
export class ResultsGenerator {
  constructor() {
    // 결과 생성 로직을 담당
  }

  // 단순 소진 계산 (투자수익률 배제)
  calculateWithdrawalAmounts(availableAssets, age, lifeExpectancy) {
    const yearsToLive = lifeExpectancy - age;
    const annualWithdrawal = availableAssets / yearsToLive;
    const dailyAmount = annualWithdrawal / 365;
    const monthlyAmount = annualWithdrawal / 12;
    
    return {
      yearsToLive,
      annualWithdrawal,
      dailyAmount,
      monthlyAmount
    };
  }

  // 총 가용 지출 금액 계산
  calculateTotalAvailable(monthlyAmount, monthlyPension, monthlyOtherIncome, monthlyHousingCost, monthlyLoanInterest) {
    // 총 가용 지출 금액 = 생활비로 쓸 수 있는 자산 + 연금 수입 + 기타 월 수입 - 월세 - 대출이자 (모두 원 단위)
    const totalMonthlyAvailable = Math.round(monthlyAmount) + 
                                 (monthlyPension * 10000) + 
                                 (monthlyOtherIncome * 10000) - 
                                 monthlyHousingCost - 
                                 monthlyLoanInterest;
    const totalDailyAvailable = Math.round(totalMonthlyAvailable / 30.4);
    
    return { totalMonthlyAvailable, totalDailyAvailable };
  }

  // 안전도 레벨 계산
  calculateSafetyLevel(totalMonthlyAvailable) {
    if (totalMonthlyAvailable >= 3000000) return '안전';
    if (totalMonthlyAvailable >= 1500000) return '보통';
    return '주의';
  }

  // 자산 그룹 분류
  getAssetGroup(assets) {
    if (assets >= 1000000) return "10억 이상";
    if (assets >= 500000) return "5-10억";
    if (assets >= 200000) return "2-5억";
    if (assets >= 50000) return "5천만-2억";
    return "5천만 미만";
  }

  // 최종 결과 객체 생성
  generateCalculatorResult(calculationData) {
    const {
      // 기본 계산 결과
      dailyAmount, monthlyAmount, annualWithdrawal, yearsToLive,
      totalDailyAvailable, totalMonthlyAvailable,
      
      // 자산 관련
      totalAssets, usableAssets, usableAssetsGross, unusableAssets, 
      availableAssets, emergencyFund, totalDebts, assets,
      realizedHousingAsset, housingValueRatio, ownedHouseDepositDebt,
      
      // 수입 관련
      monthlyPension, monthlyOtherIncome, monthlyHousingCost, monthlyLoanInterest,
      
      // 설정값
      formData, enableDownsizing, housingPensionAmount
    } = calculationData;

    return {
      // 생활비로 쓸 수 있는 자산
      dailyAmount: Math.round(dailyAmount),
      monthlyAmount: Math.round(monthlyAmount),
      annualAmount: Math.round(annualWithdrawal),
      
      // 총 가용 지출 금액 (자산 + 연금 + 기타 수입)
      totalDailyAvailable: totalDailyAvailable,
      totalMonthlyAvailable: Math.round(totalMonthlyAvailable),
      
      yearsToLive: yearsToLive,
      
      // 자산 세부사항
      assetBreakdown: {
        totalAssets, usableAssets, usableAssetsGross, unusableAssets, 
        availableAssets, emergencyFund, totalDebts,
        financial: assets.financial, 
        severance: assets.severance,
        housing: assets.housing, 
        realizedHousingAsset: realizedHousingAsset, 
        currentDeposit: assets.currentDeposit, 
        housingDebt: assets.housingDebt, 
        housingValueRatio: housingValueRatio,
        monthlyHousingCost: assets.monthlyHousingCost,
        investment: assets.investment, 
        investmentLoan: assets.investmentLoan,
        debt: assets.debt, 
        inheritance: assets.inheritance, 
        housingPensionAmount: housingPensionAmount,
        housingType: formData.housingType,
        enableDownsizing: enableDownsizing,
        ownedHouseDepositDebt: ownedHouseDepositDebt
      },
      
      // 참고 정보
      monthlyPension: monthlyPension * 10000,
      monthlyOtherIncome: monthlyOtherIncome * 10000,
      monthlyHousingCost: monthlyHousingCost,
      monthlyLoanInterest: monthlyLoanInterest,
      
      safetyLevel: this.calculateSafetyLevel(totalMonthlyAvailable)
    };
  }

  // 프로필 업데이트 데이터 생성
  generateProfileUpdate(formData, totalAssets, totalMonthlyAvailable) {
    return {
      age: parseInt(formData.age),
      assets: this.getAssetGroup(totalAssets),
      lifestyle: formData.mode, // 생활모드
      health: formData.health, // 건강상태
      monthlyRetirementBudget: Math.round(totalMonthlyAvailable / 10000) // 월 노후생활비 (만원 단위)
    };
  }
}