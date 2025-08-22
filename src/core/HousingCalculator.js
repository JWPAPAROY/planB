// 주거형태별 자산 계산 전문 모듈 (기존 로직 완전 보존)
export class HousingCalculator {
  constructor() {
    // 주거형태별 계산 로직을 담당
  }

  // 주거형태별 기본 자산/부채 계산
  calculateHousingAssets(formData) {
    let housingAsset = 0;
    let housingDebt = 0;
    let monthlyHousingCost = 0;
    
    // 기존 로직 그대로 보존
    if (formData.housingType === 'owned_living') {
      // 자가 소유 + 거주: 집값 - 대출
      housingAsset = (parseInt(formData.homeValue) || 0) * 10000;
      housingDebt = (parseInt(formData.homeMortgage) || 0) * 10000;
    } else if (formData.housingType === 'owned_renting') {
      // 자가 소유 + 전세/월세 거주: 소유한 집은 임대용 자산으로 계산
      housingAsset = (parseInt(formData.homeValue) || 0) * 10000;
      housingDebt = (parseInt(formData.homeMortgage) || 0) * 10000;
      if (formData.currentRentType === 'monthly') {
        monthlyHousingCost = (parseInt(formData.currentRent) || 0) * 10000;
      }
    } else if (formData.housingType === 'jeonse') {
      // 전세: 보증금만 자산
      housingAsset = (parseInt(formData.jeonseDeposit) || 0) * 10000;
    } else if (formData.housingType === 'monthly') {
      // 월세: 보증금만 자산, 월세는 지출
      housingAsset = (parseInt(formData.monthlyDeposit) || 0) * 10000;
      monthlyHousingCost = (parseInt(formData.monthlyRent) || 0) * 10000;
    }
    // 무주택('none')은 주거 관련 자산 0
    
    return { housingAsset, housingDebt, monthlyHousingCost };
  }

  // 주거형태별 자산 반영 비율 계산
  calculateHousingValueRatio(formData, enableDownsizing) {
    const housingPensionAmount = (parseInt(formData.housingPension) || 0);
    let housingValueRatio = 0;
    
    if (formData.housingType === 'owned_living') {
      // 자가 + 거주: 주택연금 있으면 100%, 주택 매각시 75%(양도세+수수료 고려), 없으면 0%
      if (housingPensionAmount > 0) {
        housingValueRatio = 1.0;
      } else if (enableDownsizing) {
        housingValueRatio = 0.75; // 주택 매각 시 양도세+수수료 25% 차감
      } else {
        housingValueRatio = 0; // 거주용 주택은 생활비로 사용 불가
      }
    } else if (formData.housingType === 'owned_renting') {
      // 자가 + 전세/월세 거주: 주택 매각시 75%, 아니면 0%
      if (enableDownsizing) {
        housingValueRatio = 0.75; // 주택 매각 시 양도세+수수료 25% 차감
      } else {
        housingValueRatio = 0; // 임대용 주택도 매각하지 않으면 생활비로 사용 불가
      }
    } else if (formData.housingType === 'jeonse' || formData.housingType === 'monthly') {
      // 전세/월세: 보증금은 100% 자산
      housingValueRatio = 1.0;
    }
    // 무주택: 0% (자동으로 0)
    
    return housingValueRatio;
  }

  // 주택 매각 시 실제 매각 가능 금액 계산
  calculateRealizedHousingAsset(formData, assets, housingValueRatio, enableDownsizing) {
    let realizedHousingAsset = 0;
    const ownedHouseDepositDebt = (parseInt(formData.ownedHouseDeposit) || 0) * 10000; // 임차인 보증금
    
    if (formData.housingType === 'owned_living' && enableDownsizing) {
      // 자가 거주 + 주택 매각: (집값 × 75%) - 주택담보대출
      realizedHousingAsset = Math.max(0, (assets.housing * housingValueRatio) - assets.housingDebt);
    } else if (formData.housingType === 'owned_renting' && enableDownsizing) {
      // 자가 소유 + 전세/월세 거주 + 주택 매각: (집값 × 75%) - 임차인보증금 - 주택담보대출
      realizedHousingAsset = Math.max(0, (assets.housing * housingValueRatio) - ownedHouseDepositDebt - assets.housingDebt);
    } else {
      // 일반적인 경우: 기존 로직 유지 (매각하지 않으면 0)
      realizedHousingAsset = assets.housing * housingValueRatio;
    }
    
    return { realizedHousingAsset, ownedHouseDepositDebt };
  }

  // 주택연금 선택 시 주택 자산 처리
  processHousingPension(formData, realizedHousingAsset) {
    let housingAssetForUsable = realizedHousingAsset;
    
    if (parseInt(formData.housingPension) > 0) {
      // 주택연금 선택 시 해당 주택은 자산에서 완전 배제 (소득으로 전환)
      housingAssetForUsable = 0;
    }
    
    return housingAssetForUsable;
  }
}