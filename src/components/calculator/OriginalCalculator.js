import React, { useState, useEffect } from 'react';
import { saveCalculationData } from '../../services/supabaseClient.js';
import { formatResultAmount } from '../../utils/formatters.js';

// 원본 planb-calculator.html의 계산기를 그대로 복원한 컴포넌트
export const OriginalCalculator = () => {
  // 원본 상태 그대로 복원
  const [calculatorStep, setCalculatorStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    health: '보통',
    mode: '균형',
    housingType: '',
    financialAssets: '',
    severancePay: '',
    homeValue: '',
    homeMortgage: '',
    homeMortgageInterest: '',
    ownedHouseDeposit: '',
    currentDeposit: '',
    currentRentType: '',
    currentRent: '',
    jeonseDeposit: '',
    monthlyDeposit: '',
    monthlyRent: '',
    investmentRealEstate: '',
    investmentLoan: '',
    investmentLoanInterest: '',
    debt: '',
    debtInterest: '',
    depositLoan: '',
    depositLoanInterest: '',
    inheritance: '',
    nationalPension: '',
    privatePension: '',
    housingPension: '',
    rentalIncome: '',
    workIncome: '',
    financialIncome: '',
    otherIncome: ''
  });
  
  const [calculatorResult, setCalculatorResult] = useState(null);
  const [lifeExpectancy, setLifeExpectancy] = useState(100);
  const [enableDownsizing, setEnableDownsizing] = useState(false);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [averageData, setAverageData] = useState(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showInheritanceGuide, setShowInheritanceGuide] = useState(false);

  // 원본 AmountInput 컴포넌트 정의
  const AmountInput = ({ label, value, onChange, placeholder, averageAmount }) => {
    const formatInputAmount = (value) => {
      if (!value || value === '' || value === '0') return '💰 0원';
      const num = parseInt(value);
      if (num >= 10000) return `💰 ${(num / 10000).toFixed(1)}억원`;
      if (num >= 1000) return `💰 ${Math.round(num / 1000)}천만원`;
      return `💰 ${num.toLocaleString()}만원`;
    };

    return (
      <div>
        <label className="block text-xl font-semibold text-gray-800 mb-3">{label}</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const numValue = e.target.value.replace(/[^0-9]/g, '');
            onChange(numValue);
          }}
          className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="text-green-600 font-semibold text-lg mt-1">
          {formatInputAmount(value)}
        </div>
        {averageAmount > 0 && (
          <div className="text-gray-500 text-sm mt-1">
            💡 같은 연령대 평균: {formatInputAmount(averageAmount)}
          </div>
        )}
      </div>
    );
  };

  // 원본 평균 데이터 함수
  const getAverageDataByAge = (age) => {
    if (age >= 60) return { financialAssets: 8000, severancePay: 3000, homeValue: 25000 };
    if (age >= 55) return { financialAssets: 6500, severancePay: 4000, homeValue: 28000 };
    if (age >= 50) return { financialAssets: 5000, severancePay: 5000, homeValue: 30000 };
    if (age >= 45) return { financialAssets: 3500, severancePay: 3500, homeValue: 32000 };
    return { financialAssets: 2000, severancePay: 2000, homeValue: 25000 };
  };

  // 원본 입력 핸들러
  const handleInputChange = (field, value) => {
    const cleanValue = value === '' ? '' : value;
    setFormData({ ...formData, [field]: cleanValue });
  };

  // 나이 입력 시 평균 데이터 업데이트
  useEffect(() => {
    if (formData.age) {
      setAverageData(getAverageDataByAge(parseInt(formData.age)));
    }
  }, [formData.age]);

  // 기대수명 변경 시 계산 결과 업데이트
  useEffect(() => {
    if (calculatorResult && formData.age) {
      calculateResults();
      setIsResultSaved(false);
    }
  }, [lifeExpectancy, enableDownsizing]);

  // 계산 결과 저장 함수
  const saveCalculationResult = async () => {
    if (calculatorResult) {
      try {
        // Supabase에 저장
        const savedData = await saveCalculationData({
          ...formData,
          calculationResult: calculatorResult,
          lifeExpectancy: lifeExpectancy,
          enableDownsizing: enableDownsizing
        });

        // 로컬 스토리지에도 저장
        const savedResult = {
          ...calculatorResult,
          formData: formData,
          lifeExpectancy: lifeExpectancy,
          enableDownsizing: enableDownsizing,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('planb_calculation_result', JSON.stringify(savedResult));
        setIsResultSaved(true);

        console.log('계산 결과 저장 완료:', savedData?.id);
      } catch (error) {
        console.error('계산 결과 저장 실패:', error);
      }
    }
  };

  // 원본 calculateResults 함수를 그대로 복원
  const calculateResults = () => {
    const age = parseInt(formData.age);
    
    // 자산 계산 (만원 → 원)
    let housingAsset = 0;
    let housingDebt = 0;
    let monthlyHousingCost = 0;
    
    // 월 대출 이자 (개별 합산)
    const monthlyLoanInterest = 
      ((parseInt(formData.homeMortgageInterest) || 0) + 
       (parseInt(formData.investmentLoanInterest) || 0) + 
       (parseInt(formData.debtInterest) || 0) + 
       (parseInt(formData.depositLoanInterest) || 0)) * 10000;
    
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

    const assets = {
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
    
    // 주거형태별 자산 반영 비율
    const housingPensionAmount = (parseInt(formData.housingPension) || 0);
    let housingValueRatio = 0;
    
    if (formData.housingType === 'owned_living') {
      if (housingPensionAmount > 0) {
        housingValueRatio = 1.0;
      } else if (enableDownsizing) {
        housingValueRatio = 0.75; // 주택 매각 시 양도세+수수료 25% 차감
      } else {
        housingValueRatio = 0; // 거주용 주택은 생활비로 사용 불가
      }
    } else if (formData.housingType === 'owned_renting') {
      if (enableDownsizing) {
        housingValueRatio = 0.75;
      } else {
        housingValueRatio = 0;
      }
    } else if (formData.housingType === 'jeonse' || formData.housingType === 'monthly') {
      housingValueRatio = 1.0;
    }
    
    const ownedHouseDepositDebt = (parseInt(formData.ownedHouseDeposit) || 0) * 10000;
    
    // 주택 매각 시 실제 매각 가능 금액 계산
    let realizedHousingAsset = 0;
    if (formData.housingType === 'owned_living' && enableDownsizing) {
      realizedHousingAsset = Math.max(0, (assets.housing * housingValueRatio) - assets.housingDebt);
    } else if (formData.housingType === 'owned_renting' && enableDownsizing) {
      realizedHousingAsset = Math.max(0, (assets.housing * housingValueRatio) - ownedHouseDepositDebt - assets.housingDebt);
    } else {
      realizedHousingAsset = assets.housing * housingValueRatio;
    }
    
    // 주택연금 선택 시 주택 자산 처리
    let housingAssetForUsable = realizedHousingAsset;
    if (parseInt(formData.housingPension) > 0) {
      housingAssetForUsable = 0;
    }
    
    // 생활비로 쓸 수 있는 자산 계산
    const usableAssetsGross = assets.financial + assets.severance + housingAssetForUsable;
    const usableAssets = usableAssetsGross;
    
    // 부채 정보
    const totalDebts = (enableDownsizing ? 0 : assets.housingDebt) + assets.investmentLoan + assets.debt + assets.depositLoan +
      (enableDownsizing && formData.housingType === 'owned_renting' ? 0 : ownedHouseDepositDebt);
    
    // 생활비로 쓸 수 없는 자산 계산
    const unusableAssets = assets.investment + assets.inheritance +
      (!enableDownsizing && !parseInt(formData.housingPension) && parseInt(formData.homeValue) > 0 ? (parseInt(formData.homeValue) || 0) * 10000 : 0);
    
    // 총자산
    const allAssets = assets.financial + assets.severance + assets.housing + assets.currentDeposit + assets.investment + assets.inheritance;
    const totalAssets = Math.max(0, allAssets - totalDebts);
    
    // 비상자금은 현금성 자산의 10%
    const emergencyFund = assets.financial * 0.1;
    const availableAssets = Math.max(0, usableAssets - emergencyFund);
    
    // 단순 소진 계산 (투자수익률 배제)
    const yearsToLive = lifeExpectancy - age;
    const annualWithdrawal = availableAssets / yearsToLive;
    const dailyAmount = annualWithdrawal / 365;
    const monthlyAmount = annualWithdrawal / 12;
    
    // 연금 수입
    const monthlyPension = (parseInt(formData.nationalPension) || 0) + (parseInt(formData.privatePension) || 0) + (parseInt(formData.housingPension) || 0);
    
    // 노후 월 수입
    const monthlyOtherIncome = (parseInt(formData.rentalIncome) || 0) + (parseInt(formData.workIncome) || 0) + (parseInt(formData.financialIncome) || 0) + (parseInt(formData.otherIncome) || 0);
    
    // 총 가용 지출 금액
    const totalMonthlyAvailable = Math.round(monthlyAmount) + (monthlyPension * 10000) + (monthlyOtherIncome * 10000) - monthlyHousingCost - monthlyLoanInterest;
    const totalDailyAvailable = Math.round(totalMonthlyAvailable / 30.4);
    
    setCalculatorResult({
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
        totalAssets, usableAssets, usableAssetsGross, unusableAssets, availableAssets, emergencyFund, totalDebts,
        financial: assets.financial, severance: assets.severance,
        housing: assets.housing, realizedHousingAsset: realizedHousingAsset, currentDeposit: assets.currentDeposit, housingDebt: assets.housingDebt, housingValueRatio: housingValueRatio,
        monthlyHousingCost: assets.monthlyHousingCost,
        investment: assets.investment, investmentLoan: assets.investmentLoan,
        debt: assets.debt, inheritance: assets.inheritance, 
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
      
      safetyLevel: totalMonthlyAvailable >= 3000000 ? '안전' : totalMonthlyAvailable >= 1500000 ? '보통' : '주의'
    });
    
    setCalculatorStep(4);
  };

  const getAssetGroup = (assets) => {
    if (assets >= 1000000) return "10억 이상";
    if (assets >= 500000) return "5-10억";
    if (assets >= 200000) return "2-5억";
    if (assets >= 50000) return "5천만-2억";
    return "5천만 미만";
  };

  // 1단계 렌더링
  if (calculatorStep === 1) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">🧮 노후생활비 계산기</h1>
            <p className="text-xl text-gray-600">나이와 건강상태를 입력해주세요</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6 max-w-md mx-auto">
              <div className="bg-blue-600 h-4 rounded-full" style={{width: '33%'}}></div>
            </div>
            <p className="text-lg text-gray-500 mt-3">1단계 / 3단계</p>
          </div>

          <div className="card">
            <div className="space-y-6">
              <div className="mb-6">
                <label className="block text-xl font-semibold text-gray-800 mb-3">🎂 나이</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.age}
                  onChange={(e) => {
                    const numValue = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange('age', Math.max(0, numValue));
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                  placeholder=""
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-3">💪 건강 상태</label>
                <select
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                  value={formData.health}
                  onChange={(e) => handleInputChange('health', e.target.value)}
                >
                  <option value="양호">양호 (운동 규칙적, 큰 질병 없음)</option>
                  <option value="보통">보통 (일반적인 건강 상태)</option>
                  <option value="주의필요">주의필요 (만성질환 있거나 관리 필요)</option>
                </select>
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-3">🎯 생활 모드</label>
                <select
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                  value={formData.mode}
                  onChange={(e) => handleInputChange('mode', e.target.value)}
                >
                  <option value="보수적">보수적 (안전 우선, 여유자금 확보)</option>
                  <option value="균형">균형 (평균적인 생활 수준 유지)</option>
                  <option value="적극적">적극적 (여유있는 생활, 취미활동)</option>
                </select>
              </div>

              <button
                onClick={() => setCalculatorStep(2)}
                className="btn-primary w-full text-xl py-4"
                disabled={!formData.age || !formData.health || !formData.mode}
              >
                다음 단계 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2단계 렌더링 (자산 정보)
  if (calculatorStep === 2) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">🏠 자산 정보</h1>
            <p className="text-xl text-gray-600">현재 보유하고 계신 자산을 입력해주세요</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6 max-w-md mx-auto">
              <div className="bg-blue-600 h-4 rounded-full" style={{width: '66%'}}></div>
            </div>
            <p className="text-lg text-gray-500 mt-3">2단계 / 3단계</p>
          </div>

          <div className="card">
            <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8 rounded-r-lg">
              <p className="text-lg text-green-800">
                😊 <strong>정확한 수치를 모르시는 경우에는</strong><br/>
                알고 계신 대략적인 금액을 입력하시면 됩니다.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-3">🏠 주거 형태</label>
                <select
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                  value={formData.housingType}
                  onChange={(e) => handleInputChange('housingType', e.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="owned_living">자가 소유 + 거주</option>
                  <option value="owned_renting">자가 소유 + 전세/월세 거주</option>
                  <option value="jeonse">전세</option>
                  <option value="monthly">월세</option>
                  <option value="none">무주택</option>
                </select>
              </div>

              <AmountInput
                label="🏦 현금 및 현금성 자산 (예금·적금·주식·펀드 등, 단위: 만원)"
                value={formData.financialAssets}
                onChange={(v) => handleInputChange('financialAssets', v)}
                placeholder=""
                averageAmount={averageData?.financialAssets || 0}
              />

              <AmountInput
                label="💼 퇴직금 (은퇴시 받을 퇴직금 또는 현재 남아있는 퇴직금, 단위: 만원)"
                value={formData.severancePay}
                onChange={(v) => handleInputChange('severancePay', v)}
                placeholder=""
                averageAmount={averageData?.severancePay || 0}
              />

              {/* 주거형태별 조건부 필드들 - 원본 그대로 복원 */}
              {(formData.housingType === 'owned_living' || formData.housingType === 'owned_renting') && (
                <>
                  <AmountInput
                    label="🏠 자가 소유 주택 시세 (단위: 만원)"
                    value={formData.homeValue}
                    onChange={(v) => handleInputChange('homeValue', v)}
                    placeholder=""
                    averageAmount={averageData?.homeValue || 0}
                  />
                  <AmountInput
                    label="🏠 주택담보대출 잔액 (단위: 만원)"
                    value={formData.homeMortgage}
                    onChange={(v) => handleInputChange('homeMortgage', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                  {formData.homeMortgage && parseInt(formData.homeMortgage) > 0 && (
                    <AmountInput
                      label="💳 주택담보대출 월 이자 (단위: 만원)"
                      value={formData.homeMortgageInterest}
                      onChange={(v) => handleInputChange('homeMortgageInterest', v)}
                      placeholder=""
                      averageAmount={0}
                    />
                  )}
                </>
              )}

              {formData.housingType === 'owned_renting' && (
                <>
                  <AmountInput
                    label="🏠 내 소유 집 임차인 보증금 (내가 받은 보증금, 단위: 만원)"
                    value={formData.ownedHouseDeposit}
                    onChange={(v) => handleInputChange('ownedHouseDeposit', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                  <AmountInput
                    label="🏠 현재 거주지 보증금 (내가 낸 보증금, 단위: 만원)"
                    value={formData.currentDeposit}
                    onChange={(v) => handleInputChange('currentDeposit', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                  <AmountInput
                    label="💳 보증금 대출 잔액 (단위: 만원)"
                    value={formData.depositLoan}
                    onChange={(v) => handleInputChange('depositLoan', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                  {formData.depositLoan && parseInt(formData.depositLoan) > 0 && (
                    <AmountInput
                      label="💳 보증금 대출 월 이자 (단위: 만원)"
                      value={formData.depositLoanInterest}
                      onChange={(v) => handleInputChange('depositLoanInterest', v)}
                      placeholder=""
                      averageAmount={0}
                    />
                  )}
                  <div className="mb-6">
                    <label className="block text-xl font-semibold text-gray-800 mb-3">🏠 현재 거주 형태</label>
                    <select
                      className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                      value={formData.currentRentType}
                      onChange={(e) => handleInputChange('currentRentType', e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="jeonse">전세</option>
                      <option value="monthly">월세</option>
                    </select>
                  </div>
                  {formData.currentRentType === 'monthly' && (
                    <AmountInput
                      label="🏠 현재 거주지 월세 (내가 내는 월세, 단위: 만원)"
                      value={formData.currentRent}
                      onChange={(v) => handleInputChange('currentRent', v)}
                      placeholder=""
                      averageAmount={0}
                    />
                  )}
                </>
              )}

              {formData.housingType === 'jeonse' && (
                <AmountInput
                  label="🏠 전세보증금 (단위: 만원)"
                  value={formData.jeonseDeposit}
                  onChange={(v) => handleInputChange('jeonseDeposit', v)}
                  placeholder=""
                  averageAmount={0}
                />
              )}

              {formData.housingType === 'monthly' && (
                <>
                  <AmountInput
                    label="🏠 월세보증금 (단위: 만원)"
                    value={formData.monthlyDeposit}
                    onChange={(v) => handleInputChange('monthlyDeposit', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                  <AmountInput
                    label="🏠 월세 (단위: 만원)"
                    value={formData.monthlyRent}
                    onChange={(v) => handleInputChange('monthlyRent', v)}
                    placeholder=""
                    averageAmount={0}
                  />
                </>
              )}

              <AmountInput
                label="🏢 수익형 부동산 (오피스텔·상가 등, 단위: 만원)"
                value={formData.investmentRealEstate}
                onChange={(v) => handleInputChange('investmentRealEstate', v)}
                placeholder=""
                averageAmount={0}
              />

              <AmountInput
                label="🏢 수익형 부동산 대출 잔액 (단위: 만원)"
                value={formData.investmentLoan}
                onChange={(v) => handleInputChange('investmentLoan', v)}
                placeholder=""
                averageAmount={0}
              />
              {formData.investmentLoan && parseInt(formData.investmentLoan) > 0 && (
                <AmountInput
                  label="💳 수익형 부동산 대출 월 이자 (단위: 만원)"
                  value={formData.investmentLoanInterest}
                  onChange={(v) => handleInputChange('investmentLoanInterest', v)}
                  placeholder=""
                  averageAmount={0}
                />
              )}

              <AmountInput
                label="💳 기타 대출 잔액 (단위: 만원)"
                value={formData.debt}
                onChange={(v) => handleInputChange('debt', v)}
                placeholder=""
                averageAmount={0}
              />
              {formData.debt && parseInt(formData.debt) > 0 && (
                <AmountInput
                  label="💳 기타 대출 월 이자 (단위: 만원)"
                  value={formData.debtInterest}
                  onChange={(v) => handleInputChange('debtInterest', v)}
                  placeholder=""
                  averageAmount={0}
                />
              )}

              <AmountInput
                label="👨‍👩‍👧‍👦 가족 증여 또는 상속 예정액 (단위: 만원)"
                value={formData.inheritance}
                onChange={(v) => handleInputChange('inheritance', v)}
                placeholder=""
                averageAmount={0}
              />

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setCalculatorStep(1)}
                  className="border border-gray-300 px-6 py-3 rounded-lg flex-1"
                >
                  ← 이전 단계
                </button>
                <button
                  onClick={() => setCalculatorStep(3)}
                  className="btn-primary flex-1"
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3단계 - 추가 수입·지출 (원본 그대로 복원)
  if (calculatorStep === 3) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">📋 추가 수입·지출</h1>
            <p className="text-xl text-gray-600">매달 들어오는 연금이나 나가는 고정비용 (선택사항)</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6 max-w-md mx-auto">
              <div className="bg-blue-600 h-4 rounded-full" style={{width: '100%'}}></div>
            </div>
            <p className="text-lg text-gray-500 mt-3">3단계 / 3단계</p>
          </div>

          <div className="card">
            <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8 rounded-r-lg">
              <p className="text-lg text-green-800">
                😊 <strong>정확한 수치를 모르시는 경우에는</strong><br/>
                알고 계신 대략적인 금액을 입력하시면 됩니다.
              </p>
            </div>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">📈 매달 받는 연금 (단위: 만원)</h2>
            
            <div className="space-y-6">
              <AmountInput
                label="🏛️ 국민연금 (월 수령액)"
                value={formData.nationalPension}
                onChange={(v) => handleInputChange('nationalPension', v)}
                placeholder=""
                averageAmount={averageData?.nationalPension || 0}
              />
              
              <AmountInput
                label="💰 개인연금 (월 수령액)"
                value={formData.privatePension}
                onChange={(v) => handleInputChange('privatePension', v)}
                placeholder=""
                averageAmount={averageData?.privatePension || 0}
              />
              
              <AmountInput
                label="🏠 주택연금 (월 수령액)"
                value={formData.housingPension}
                onChange={(v) => handleInputChange('housingPension', v)}
                placeholder=""
                averageAmount={0}
              />
            </div>

            <h2 className="text-2xl font-bold mb-6 mt-8 text-gray-800">💼 기타 월 수입 (단위: 만원)</h2>
            
            <div className="space-y-6">
              <AmountInput
                label="🏠 임대소득 (월 수령액)"
                value={formData.rentalIncome}
                onChange={(v) => handleInputChange('rentalIncome', v)}
                placeholder=""
                averageAmount={0}
              />
              
              <AmountInput
                label="💼 근로소득 (파트타임, 자문료 등)"
                value={formData.workIncome}
                onChange={(v) => handleInputChange('workIncome', v)}
                placeholder=""
                averageAmount={0}
              />
              
              <AmountInput
                label="💰 금융소득 (배당금, 이자 등)"
                value={formData.financialIncome}
                onChange={(v) => handleInputChange('financialIncome', v)}
                placeholder=""
                averageAmount={0}
              />
              
              <AmountInput
                label="📚 기타소득 (강의, 로열티 등)"
                value={formData.otherIncome}
                onChange={(v) => handleInputChange('otherIncome', v)}
                placeholder=""
                averageAmount={0}
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCalculatorStep(2)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold"
              >
                ← 이전 단계
              </button>
              <button
                onClick={calculateResults}
                className="btn-primary flex-1"
              >
                🚀 노후생활비 계산하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4단계 - 결과 표시 (원본 완전 복원)
  if (calculatorStep === 4 && calculatorResult) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">🎉 노후생활비 계산 완료!</h1>
          </div>

          <div className="card mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-4">
                하루 {formatResultAmount(calculatorResult.totalDailyAvailable)}
              </div>
              <div className="text-3xl text-gray-600 mb-4">
                월 {formatResultAmount(calculatorResult.totalMonthlyAvailable)}
              </div>
              
              {/* 안전 수준 표시 */}
              <div className={`inline-block px-6 py-3 rounded-full text-white font-bold text-lg mb-4 ${
                calculatorResult.safetyLevel === '안전' ? 'bg-green-500' :
                calculatorResult.safetyLevel === '보통' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {calculatorResult.safetyLevel} 수준
              </div>
              
              {/* 기대수명 조정 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-sm font-medium text-blue-800">기대수명:</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setLifeExpectancy(Math.max(70, lifeExpectancy - 5))}
                      className="w-8 h-8 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center text-blue-700 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg text-blue-600 min-w-[50px] text-center">{lifeExpectancy}세</span>
                    <button 
                      onClick={() => setLifeExpectancy(Math.min(110, lifeExpectancy + 5))}
                      className="w-8 h-8 bg-blue-200 hover:bg-blue-300 rounded-full flex items-center justify-center text-blue-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-xs text-blue-600 text-center">
                  {formData.age}세부터 {lifeExpectancy}세까지 ({lifeExpectancy - parseInt(formData.age)}년간) 자산 보존
                </div>
              </div>

              {/* 계산 결과 저장 */}
              {!isResultSaved ? (
                <div className="text-center mb-6">
                  <button
                    onClick={saveCalculationResult}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    💾 내 계산결과 저장하기
                  </button>
                  <div className="text-sm text-blue-600 mt-2 font-medium">
                    계산 결과를 저장하면 나와 비슷한 사람들과 이야기할 수 있어요!
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    언제든지 다시 계산하고 업데이트 할 수 있습니다
                  </div>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <div className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold">
                    ✅ 계산결과가 저장되었습니다!
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    언제든지 다시 계산하고 업데이트 할 수 있습니다
                  </div>
                  <div className="text-sm text-blue-600 mt-1 font-medium">
                    👇 아래에서 비슷한 분들과 소통해보세요
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">💰 수입 구성</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>자산을 활용한 생활비:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatResultAmount(calculatorResult.monthlyAmount)}/월</span>
                  <button
                    onClick={() => setShowAssetDetail(!showAssetDetail)}
                    className="text-white text-sm px-3 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-md animate-pulse"
                  >
                    {showAssetDetail ? '📊 계산과정 숨기기' : '📊 계산과정 보기'}
                  </button>
                </div>
              </div>
              
              {!showAssetDetail && (
                <div className="text-center mt-2">
                  <p className="text-xs text-blue-600">💡 계산과정을 보시면 자산 분류와 주택 매각 옵션을 확인할 수 있습니다</p>
                </div>
              )}

              {/* 자산 계산 상세 설명 */}
              {showAssetDetail && (
                <div className="bg-blue-50 p-4 rounded-lg mt-3 space-y-3 text-sm">
                  <div className="font-semibold text-blue-800 mb-2">📊 계산 과정</div>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">• 순 자산:</span>
                        <span className="font-bold">{formatResultAmount(calculatorResult.assetBreakdown?.totalAssets || 0)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">입력하신 모든 자산을 생활비로 쓸 수 있는 자산과 쓸 수 없는 자산으로 구분했습니다</p>

                      {/* 주택 매각 옵션 */}
                      {(formData.housingType === 'owned_living' || formData.housingType === 'owned_renting') && !parseInt(formData.housingPension) && (
                        <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-300 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-orange-800">🏠 주택 매각 옵션</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={enableDownsizing}
                                onChange={(e) => setEnableDownsizing(e.target.checked)}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm font-medium text-orange-800">매각했을 때 생활비 계산하기</span>
                            </label>
                          </div>
                          <div className="text-xs text-orange-600">
                            주택을 매각하면 더 많은 노후생활비를 확보할 수 있어요.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {calculatorResult.monthlyPension > 0 && (
                <div className="flex justify-between items-center">
                  <span>연금 수입:</span>
                  <span className="font-bold">{formatResultAmount(calculatorResult.monthlyPension)}/월</span>
                </div>
              )}

              {calculatorResult.monthlyOtherIncome > 0 && (
                <div className="flex justify-between items-center">
                  <span>기타 수입:</span>
                  <span className="font-bold">{formatResultAmount(calculatorResult.monthlyOtherIncome)}/월</span>
                </div>
              )}

              {calculatorResult.monthlyHousingCost > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>주거비 지출:</span>
                  <span className="font-bold">-{formatResultAmount(calculatorResult.monthlyHousingCost)}/월</span>
                </div>
              )}

              {calculatorResult.monthlyLoanInterest > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>대출이자:</span>
                  <span className="font-bold">-{formatResultAmount(calculatorResult.monthlyLoanInterest)}/월</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>총 사용가능 금액:</span>
                  <span className="text-blue-600">{formatResultAmount(calculatorResult.totalMonthlyAvailable)}/월</span>
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={() => {
                setCalculatorStep(1);
                setCalculatorResult(null);
                setIsResultSaved(false);
                setShowAssetDetail(false);
              }}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              🔄 새로 계산하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OriginalCalculator;