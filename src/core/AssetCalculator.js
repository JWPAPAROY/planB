// 자산 및 부채 계산 전문 모듈 (기존 로직 완전 보존)
export class AssetCalculator {
  constructor() {
    // 자산/부채 계산 로직을 담당
  }

  // 기본 자산 정보 계산 (만원 → 원 변환)
  calculateBasicAssets(formData, housingCalculationResult) {
    const { housingAsset, housingDebt, monthlyHousingCost } = housingCalculationResult;
    
    return {
      financial: (parseInt(formData.financialAssets) || 0) * 10000,
      severance: (parseInt(formData.severancePay) || 0) * 10000,
      housing: housingAsset,
      currentDeposit: (parseInt(formData.currentDeposit) || 0) * 10000,
      housingDebt: housingDebt,
      monthlyHousingCost: monthlyHousingCost,
      investment: (parseInt(formData.investmentRealEstate) || 0) * 10000,
      investmentLoan: (parseInt(formData.investmentLoan) || 0) * 10000,
      debt: (parseInt(formData.debt) || 0) * 10000,
      depositLoan: (parseInt(formData.depositLoan) || 0) * 10000,
      inheritance: (parseInt(formData.inheritance) || 0) * 10000
    };
  }

  // 월 대출 이자 계산 (개별 합산)
  calculateMonthlyLoanInterest(formData) {
    return ((parseInt(formData.homeMortgageInterest) || 0) + 
            (parseInt(formData.investmentLoanInterest) || 0) + 
            (parseInt(formData.debtInterest) || 0) + 
            (parseInt(formData.depositLoanInterest) || 0)) * 10000;
  }

  // 생활비로 쓸 수 있는 자산 계산
  calculateUsableAssets(assets, housingAssetForUsable) {
    // 생활비로 쓸 수 있는 자산 계산 (부채 차감 전)
    // 거주지 보증금은 생활비로 쓸 수 없는 자산이므로 제외
    const usableAssetsGross = assets.financial + assets.severance + housingAssetForUsable;
    
    // 생활비로 쓸 수 있는 자산 (부채 차감 안 함)
    const usableAssets = usableAssetsGross;
    
    return { usableAssetsGross, usableAssets };
  }

  // 총 부채 계산
  calculateTotalDebts(formData, assets, enableDownsizing, ownedHouseDepositDebt) {
    return (enableDownsizing ? 0 : assets.housingDebt) + 
           assets.investmentLoan + 
           assets.debt + 
           assets.depositLoan +
           (enableDownsizing && formData.housingType === 'owned_renting' ? 0 : ownedHouseDepositDebt);
  }

  // 생활비로 쓸 수 없는 자산 계산
  calculateUnusableAssets(formData, assets, enableDownsizing) {
    return assets.investment + 
           assets.inheritance +
           (!enableDownsizing && !parseInt(formData.housingPension) && parseInt(formData.homeValue) > 0 ? 
             (parseInt(formData.homeValue) || 0) * 10000 : 0);
  }

  // 총자산 계산 (모든 자산의 합 - 부채)
  calculateTotalAssets(assets, totalDebts) {
    const allAssets = assets.financial + assets.severance + assets.housing + 
                     assets.currentDeposit + assets.investment + assets.inheritance;
    return Math.max(0, allAssets - totalDebts);
  }

  // 비상자금 및 실제 사용가능 자산 계산
  calculateAvailableAssets(assets, usableAssets) {
    // 비상자금은 현금성 자산의 10%
    const emergencyFund = assets.financial * 0.1;
    const availableAssets = Math.max(0, usableAssets - emergencyFund);
    
    return { emergencyFund, availableAssets };
  }

  // 연금 및 기타 수입 계산
  calculateMonthlyIncomes(formData) {
    // 연금 수입 (만원 → 원)
    const monthlyPension = (parseInt(formData.nationalPension) || 0) + 
                          (parseInt(formData.privatePension) || 0) + 
                          (parseInt(formData.housingPension) || 0);
    
    // 노후 월 수입 (만원 → 원)
    const monthlyOtherIncome = (parseInt(formData.rentalIncome) || 0) + 
                              (parseInt(formData.workIncome) || 0) + 
                              (parseInt(formData.financialIncome) || 0) + 
                              (parseInt(formData.otherIncome) || 0);
    
    return { monthlyPension, monthlyOtherIncome };
  }
}