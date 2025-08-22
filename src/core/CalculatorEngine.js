// 리팩토링된 계산기 엔진 - 모듈화된 계산 로직 사용 (기능 완전 보존)
import { HousingCalculator } from './HousingCalculator.js';
import { AssetCalculator } from './AssetCalculator.js';
import { ResultsGenerator } from './ResultsGenerator.js';

export class CalculatorEngine {
  constructor() {
    this.housingCalculator = new HousingCalculator();
    this.assetCalculator = new AssetCalculator();
    this.resultsGenerator = new ResultsGenerator();
  }

  // 리팩토링된 calculateResults 함수 - 기존 로직 완전 보존
  calculateResults(formData, lifeExpectancy = 100, enableDownsizing = false) {
    const age = parseInt(formData.age);
    
    // 1. 주거 관련 계산
    const housingResult = this.housingCalculator.calculateHousingAssets(formData);
    const housingValueRatio = this.housingCalculator.calculateHousingValueRatio(formData, enableDownsizing);
    
    // 2. 기본 자산 계산
    const assets = this.assetCalculator.calculateBasicAssets(formData, housingResult);
    const monthlyLoanInterest = this.assetCalculator.calculateMonthlyLoanInterest(formData);
    
    // 3. 주택 매각 관련 계산
    const { realizedHousingAsset, ownedHouseDepositDebt } = this.housingCalculator.calculateRealizedHousingAsset(
      formData, assets, housingValueRatio, enableDownsizing
    );
    const housingAssetForUsable = this.housingCalculator.processHousingPension(formData, realizedHousingAsset);
    
    // 4. 자산 및 부채 계산
    const { usableAssetsGross, usableAssets } = this.assetCalculator.calculateUsableAssets(assets, housingAssetForUsable);
    const totalDebts = this.assetCalculator.calculateTotalDebts(formData, assets, enableDownsizing, ownedHouseDepositDebt);
    const unusableAssets = this.assetCalculator.calculateUnusableAssets(formData, assets, enableDownsizing);
    const totalAssets = this.assetCalculator.calculateTotalAssets(assets, totalDebts);
    const { emergencyFund, availableAssets } = this.assetCalculator.calculateAvailableAssets(assets, usableAssets);
    
    // 5. 수입 계산
    const { monthlyPension, monthlyOtherIncome } = this.assetCalculator.calculateMonthlyIncomes(formData);
    
    // 6. 최종 결과 계산
    const withdrawalAmounts = this.resultsGenerator.calculateWithdrawalAmounts(availableAssets, age, lifeExpectancy);
    const { totalMonthlyAvailable, totalDailyAvailable } = this.resultsGenerator.calculateTotalAvailable(
      withdrawalAmounts.monthlyAmount, monthlyPension, monthlyOtherIncome, 
      assets.monthlyHousingCost, monthlyLoanInterest
    );
    
    // 7. 디버깅 로그 (기존 로직 보존)
    console.log('계산 확인:', {
      '현금성자산': assets.financial,
      '퇴직금': assets.severance,
      '주택매각금': realizedHousingAsset,
      '거주지보증금': assets.currentDeposit,
      '주택연금': parseInt(formData.housingPension) > 0 ? (parseInt(formData.homeValue) || 0) * 10000 : 0,
      usableAssetsGross,
      '주택대출': assets.housingDebt,
      '투자대출': assets.investmentLoan,
      '기타대출': assets.debt,
      '임차인보증금': enableDownsizing && formData.housingType === 'owned_renting' ? 0 : ownedHouseDepositDebt,
      totalDebts, 
      usableAssets,
      emergencyFund: assets.financial * 0.1
    });
    
    console.log('총자산 계산:', {
      '현금성자산': assets.financial,
      '퇴직금': assets.severance, 
      '주택자산': assets.housing,
      '거주지보증금': assets.currentDeposit,
      '수익형부동산': assets.investment,
      '증여상속': assets.inheritance,
      'allAssets': assets.financial + assets.severance + assets.housing + assets.currentDeposit + assets.investment + assets.inheritance,
      'totalDebts': totalDebts,
      'totalAssets': totalAssets
    });
    
    console.log('setCalculatorResult 호출:', { usableAssets, availableAssets });
    
    // 8. 최종 결과 생성
    const calculationData = {
      dailyAmount: withdrawalAmounts.dailyAmount,
      monthlyAmount: withdrawalAmounts.monthlyAmount,
      annualWithdrawal: withdrawalAmounts.annualWithdrawal,
      yearsToLive: withdrawalAmounts.yearsToLive,
      totalDailyAvailable,
      totalMonthlyAvailable,
      totalAssets, usableAssets, usableAssetsGross, unusableAssets, 
      availableAssets, emergencyFund, totalDebts, assets,
      realizedHousingAsset, housingValueRatio, ownedHouseDepositDebt,
      monthlyPension, monthlyOtherIncome, 
      monthlyHousingCost: assets.monthlyHousingCost, monthlyLoanInterest,
      formData, enableDownsizing, 
      housingPensionAmount: parseInt(formData.housingPension) || 0
    };
    
    return this.resultsGenerator.generateCalculatorResult(calculationData);
  }

  // 기존 나이별 평균 데이터 함수도 그대로 보존
  getAverageDataByAge(age) {
    // 기존 getAverageDataByAge 로직 그대로 이전
    const ageGroups = {
        '40': { financial: 3500, severance: 2800, housing: 35000, debt: 8000 },
        '50': { financial: 5200, severance: 4500, housing: 42000, debt: 6500 },
        '60': { financial: 4800, severance: 6200, housing: 38000, debt: 3200 },
        '70': { financial: 3200, severance: 0, housing: 35000, debt: 1800 }
    };
    
    // 나이대별 평균값 반환 로직...
    if (age < 45) return ageGroups['40'];
    if (age < 55) return ageGroups['50'];
    if (age < 65) return ageGroups['60'];
    return ageGroups['70'];
  }
}