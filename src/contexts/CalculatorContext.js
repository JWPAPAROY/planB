// 계산기 상태 관리 Context (기존 기능 완전 보존)
import React, { createContext, useContext, useReducer } from 'react';

// 초기 상태 정의 (기존 formData 구조 보존)
const initialState = {
  // 1단계: 기본 정보
  basicInfo: {
    age: '',
    health: '보통',
    mode: '균형'
  },
  
  // 2단계: 자산 정보
  assetInfo: {
    housingType: '', // 주거형태
    financialAssets: '',
    severancePay: '',
    // 주거 관련 (주거형태별로 다름)
    homeValue: '',
    homeMortgage: '',
    jeonseDeposit: '',
    monthlyDeposit: '',
    monthlyRent: '',
    investmentRealEstate: '',
    investmentLoan: '',
    currentDeposit: '',
    currentRentType: '',
    currentRent: '',
    ownedHouseDeposit: ''
  },
  
  // 3단계: 부채 및 연금
  debtPensionInfo: {
    debt: '',
    inheritance: '',
    nationalPension: '',
    privatePension: '',
    housingPension: '',
    // 노후 월 수입
    rentalIncome: '',
    workIncome: '',
    financialIncome: '',
    otherIncome: '',
    // 월 지출
    basicLiving: '',
    communication: '',
    medical: '',
    // 월 이자 지출
    homeMortgageInterest: '',
    investmentLoanInterest: '',
    debtInterest: '',
    depositLoanInterest: '',
    // 보증금 대출
    depositLoan: ''
  },
  
  // 계산 결과 및 설정
  calculationSettings: {
    lifeExpectancy: 100,
    enableDownsizing: false,
    currentStep: 1
  },
  
  // 계산 결과
  results: null,
  
  // 평균 데이터
  averageData: null
};

// 액션 타입 정의
export const CALCULATOR_ACTIONS = {
  // 단계별 데이터 업데이트
  UPDATE_BASIC_INFO: 'UPDATE_BASIC_INFO',
  UPDATE_ASSET_INFO: 'UPDATE_ASSET_INFO',
  UPDATE_DEBT_PENSION_INFO: 'UPDATE_DEBT_PENSION_INFO',
  UPDATE_CALCULATION_SETTINGS: 'UPDATE_CALCULATION_SETTINGS',
  
  // 개별 필드 업데이트
  UPDATE_FIELD: 'UPDATE_FIELD',
  
  // 단계 이동
  SET_STEP: 'SET_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREVIOUS_STEP: 'PREVIOUS_STEP',
  
  // 계산 결과
  SET_RESULTS: 'SET_RESULTS',
  SET_AVERAGE_DATA: 'SET_AVERAGE_DATA',
  
  // 초기화
  RESET_CALCULATOR: 'RESET_CALCULATOR',
  RESET_STEP: 'RESET_STEP'
};

// Reducer 함수
const calculatorReducer = (state, action) => {
  switch (action.type) {
    case CALCULATOR_ACTIONS.UPDATE_BASIC_INFO:
      return {
        ...state,
        basicInfo: { ...state.basicInfo, ...action.payload }
      };
      
    case CALCULATOR_ACTIONS.UPDATE_ASSET_INFO:
      return {
        ...state,
        assetInfo: { ...state.assetInfo, ...action.payload }
      };
      
    case CALCULATOR_ACTIONS.UPDATE_DEBT_PENSION_INFO:
      return {
        ...state,
        debtPensionInfo: { ...state.debtPensionInfo, ...action.payload }
      };
      
    case CALCULATOR_ACTIONS.UPDATE_CALCULATION_SETTINGS:
      return {
        ...state,
        calculationSettings: { ...state.calculationSettings, ...action.payload }
      };
      
    case CALCULATOR_ACTIONS.UPDATE_FIELD:
      const { section, field, value } = action.payload;
      return {
        ...state,
        [section]: { ...state[section], [field]: value }
      };
      
    case CALCULATOR_ACTIONS.SET_STEP:
      return {
        ...state,
        calculationSettings: { ...state.calculationSettings, currentStep: action.payload }
      };
      
    case CALCULATOR_ACTIONS.NEXT_STEP:
      return {
        ...state,
        calculationSettings: { 
          ...state.calculationSettings, 
          currentStep: Math.min(state.calculationSettings.currentStep + 1, 4) 
        }
      };
      
    case CALCULATOR_ACTIONS.PREVIOUS_STEP:
      return {
        ...state,
        calculationSettings: { 
          ...state.calculationSettings, 
          currentStep: Math.max(state.calculationSettings.currentStep - 1, 1) 
        }
      };
      
    case CALCULATOR_ACTIONS.SET_RESULTS:
      return {
        ...state,
        results: action.payload
      };
      
    case CALCULATOR_ACTIONS.SET_AVERAGE_DATA:
      return {
        ...state,
        averageData: action.payload
      };
      
    case CALCULATOR_ACTIONS.RESET_CALCULATOR:
      return initialState;
      
    case CALCULATOR_ACTIONS.RESET_STEP:
      const stepToReset = action.payload;
      if (stepToReset === 1) {
        return { ...state, basicInfo: initialState.basicInfo };
      } else if (stepToReset === 2) {
        return { ...state, assetInfo: initialState.assetInfo };
      } else if (stepToReset === 3) {
        return { ...state, debtPensionInfo: initialState.debtPensionInfo };
      }
      return state;
      
    default:
      return state;
  }
};

// Context 생성
const CalculatorContext = createContext();

// Provider 컴포넌트
export const CalculatorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  
  return (
    <CalculatorContext.Provider value={{ state, dispatch }}>
      {children}
    </CalculatorContext.Provider>
  );
};

// Custom Hook
export const useCalculatorContext = () => {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculatorContext must be used within a CalculatorProvider');
  }
  return context;
};