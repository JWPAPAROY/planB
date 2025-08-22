import React from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm.js';
import { Step1BasicInfo } from './steps/Step1BasicInfo.js';
import { Step2AssetInfo } from './steps/Step2AssetInfo.js';
import { Step3DebtPension } from './steps/Step3DebtPension.js';
import { Step4Results } from './steps/Step4Results.js';

// 리팩토링된 계산기 폼 컴포넌트 (기능과 UI/UX 완전 보존)
export const CalculatorForm = ({ onResultCalculated }) => {
  const {
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
  } = useCalculatorForm();

  // 단계 이동 핸들러들
  const handleNextStep = () => setCalculatorStep(calculatorStep + 1);
  const handlePreviousStep = () => setCalculatorStep(calculatorStep - 1);
  
  // 계산 실행 핸들러
  const handleCalculateWithCallback = () => handleCalculate(onResultCalculated);
  
  // 전문가 상담 연계 핸들러
  const handleExpertConsultation = () => {
    if (onResultCalculated) {
      onResultCalculated(calculatorResult, formData, 'EXPERT_CONSULTATION');
    }
  };

  return (
    <div className="calculator-container">
      {/* Step 1: 기본 정보 */}
      {calculatorStep === 1 && (
        <Step1BasicInfo
          formData={formData}
          handleInputChange={handleInputChange}
          onNext={handleNextStep}
        />
      )}
      
      {/* Step 2: 자산 정보 */}
      {calculatorStep === 2 && (
        <Step2AssetInfo
          formData={formData}
          averageData={averageData}
          handleInputChange={handleInputChange}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
        />
      )}
      
      {/* Step 3: 부채 및 연금 */}
      {calculatorStep === 3 && (
        <Step3DebtPension
          formData={formData}
          averageData={averageData}
          lifeExpectancy={lifeExpectancy}
          enableDownsizing={enableDownsizing}
          handleInputChange={handleInputChange}
          setLifeExpectancy={setLifeExpectancy}
          setEnableDownsizing={setEnableDownsizing}
          onCalculate={handleCalculateWithCallback}
          onPrevious={handlePreviousStep}
        />
      )}
      
      {/* Step 4: 결과 분석 */}
      {calculatorStep === 4 && calculatorResult && (
        <Step4Results
          calculatorResult={calculatorResult}
          lifeExpectancy={lifeExpectancy}
          onExpertConsultation={handleExpertConsultation}
          onReset={resetCalculator}
        />
      )}
    </div>
  );
};

export default CalculatorForm;