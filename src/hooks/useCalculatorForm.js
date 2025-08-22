import { useEffect } from 'react';
import { CalculatorEngine } from '../core/CalculatorEngine.js';
import { useCalculatorContext, CALCULATOR_ACTIONS } from '../contexts/CalculatorContext.js';
import { saveCalculationData, checkSupabaseConnection, getDebugInfo } from '../services/supabaseClient.js';

// 계산기 폼 상태 관리 커스텀 훅 (Context 기반으로 개선, 기능 완전 보존)
export const useCalculatorForm = () => {
  const { state, dispatch } = useCalculatorContext();
  
  // Context에서 상태 추출
  const calculatorStep = state.calculationSettings.currentStep;
  const formData = {
    // 기본 정보
    ...state.basicInfo,
    // 자산 정보
    ...state.assetInfo,
    // 부채/연금 정보
    ...state.debtPensionInfo
  };
  const calculatorResult = state.results;
  const averageData = state.averageData;
  const lifeExpectancy = state.calculationSettings.lifeExpectancy;
  const enableDownsizing = state.calculationSettings.enableDownsizing;
  
  const calculatorEngine = new CalculatorEngine();

  // 기존 handleInputChange 함수 그대로 보존 (Context 기반으로 수정)
  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'age') {
      processedValue = value.replace(/[^0-9]/g, '');
      processedValue = Math.max(0, processedValue);
    }
    
    // 필드가 어느 섹션에 속하는지 판단하여 적절한 액션 디스패치
    if (['age', 'health', 'mode'].includes(field)) {
      dispatch({
        type: CALCULATOR_ACTIONS.UPDATE_BASIC_INFO,
        payload: { [field]: processedValue }
      });
    } else if (['housingType', 'financialAssets', 'severancePay', 'homeValue', 'homeMortgage', 
               'jeonseDeposit', 'monthlyDeposit', 'monthlyRent', 'investmentRealEstate', 
               'investmentLoan', 'currentDeposit', 'currentRentType', 'currentRent', 'ownedHouseDeposit'].includes(field)) {
      dispatch({
        type: CALCULATOR_ACTIONS.UPDATE_ASSET_INFO,
        payload: { [field]: processedValue }
      });
    } else {
      dispatch({
        type: CALCULATOR_ACTIONS.UPDATE_DEBT_PENSION_INFO,
        payload: { [field]: processedValue }
      });
    }
  };

  // 기존 평균 데이터 로직 보존 (Context 기반으로 수정)
  useEffect(() => {
    if (state.basicInfo.age) {
      const avgData = calculatorEngine.getAverageDataByAge(parseInt(state.basicInfo.age));
      dispatch({
        type: CALCULATOR_ACTIONS.SET_AVERAGE_DATA,
        payload: avgData
      });
    }
  }, [state.basicInfo.age, dispatch]);

  // 기존 calculateResults 호출 방식 보존 + Supabase 저장 기능 추가
  const handleCalculate = async (onResultCalculated) => {
    const result = calculatorEngine.calculateResults(formData, lifeExpectancy, enableDownsizing);
    
    // 결과 저장 (Context)
    dispatch({
      type: CALCULATOR_ACTIONS.SET_RESULTS,
      payload: result
    });
    
    // Supabase에 계산 데이터 저장 (비동기)
    try {
      console.log('💾 계산 결과를 Supabase에 저장 중...');
      const savedData = await saveCalculationData({
        ...formData,
        calculationResult: result,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ 계산 데이터 저장 완료:', savedData?.id || 'localStorage');
      
      // 저장된 ID를 결과에 포함
      const resultWithId = { ...result, savedDataId: savedData?.id };
      dispatch({
        type: CALCULATOR_ACTIONS.SET_RESULTS,
        payload: resultWithId
      });
    } catch (error) {
      console.warn('⚠️ 데이터 저장 실패, 계산은 정상 진행:', error.message);
    }
    
    // 4단계로 이동
    dispatch({
      type: CALCULATOR_ACTIONS.SET_STEP,
      payload: 4
    });
    
    // 부모 컴포넌트에 결과 전달 (전문가 매칭 연계용)
    if (onResultCalculated) {
      onResultCalculated(result, formData);
    }
  };

  // 새로 계산하기 (초기화)
  const resetCalculator = () => {
    dispatch({ type: CALCULATOR_ACTIONS.RESET_CALCULATOR });
  };
  
  // 단계 변경 함수들
  const setCalculatorStep = (step) => {
    dispatch({
      type: CALCULATOR_ACTIONS.SET_STEP,
      payload: step
    });
  };
  
  const setLifeExpectancy = (age) => {
    dispatch({
      type: CALCULATOR_ACTIONS.UPDATE_CALCULATION_SETTINGS,
      payload: { lifeExpectancy: age }
    });
  };
  
  const setEnableDownsizing = (enabled) => {
    dispatch({
      type: CALCULATOR_ACTIONS.UPDATE_CALCULATION_SETTINGS,
      payload: { enableDownsizing: enabled }
    });
  };

  return {
    // 상태
    calculatorStep,
    formData,
    calculatorResult,
    averageData,
    lifeExpectancy,
    enableDownsizing,
    
    // 상태 변경 함수들
    setCalculatorStep,
    setLifeExpectancy,
    setEnableDownsizing,
    handleInputChange,
    handleCalculate,
    resetCalculator
  };
};