import React, { useState } from 'react';
import { formatResultAmount } from '../../../utils/formatters.js';
import { ExpenseTracker } from '../ExpenseTracker.js';
import { PeerComparison } from '../PeerComparison.js';
import { useCalculatorContext } from '../../../contexts/CalculatorContext.js';

// 4단계: 결과 분석 + 지출 입력 + 또래 비교 컴포넌트
export const Step4Results = ({ 
  calculatorResult,
  lifeExpectancy,
  onExpertConsultation,
  onReset 
}) => {
  const { state } = useCalculatorContext();
  const [currentStep, setCurrentStep] = useState('results'); // 'results' | 'expenses' | 'comparison'
  const [userExpenses, setUserExpenses] = useState(null);
  
  // 계산 데이터에서 필요한 정보 추출
  const formData = {
    ...state.basicInfo,
    ...state.assetInfo,
    ...state.debtPensionInfo
  };
  
  const totalAssets = (
    (parseInt(formData.financialAssets) || 0) + 
    (parseInt(formData.severancePay) || 0) + 
    (parseInt(formData.homeValue) || 0)
  ) * 10000;
  
  const handleExpenseInput = () => {
    setCurrentStep('expenses');
  };
  
  const handleExpensesSaved = (expenses, savedData) => {
    setUserExpenses(expenses);
    setCurrentStep('comparison');
  };
  
  const handleSkipExpenses = () => {
    setCurrentStep('comparison');
  };
  
  const handleContinueFromComparison = () => {
    if (onExpertConsultation) {
      onExpertConsultation();
    }
  };
  
  // 지출 입력 단계
  if (currentStep === 'expenses') {
    return (
      <ExpenseTracker 
        calculationId={calculatorResult?.savedDataId}
        onExpensesSaved={handleExpensesSaved}
        onSkip={handleSkipExpenses}
      />
    );
  }
  
  // 또래 비교 단계
  if (currentStep === 'comparison') {
    return (
      <PeerComparison 
        userExpenses={userExpenses}
        userAge={parseInt(formData.age) || 65}
        userAssets={totalAssets}
        onContinue={handleContinueFromComparison}
      />
    );
  }
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">✨ 노후생활비 계산 결과</h1>
          <p className="text-xl text-gray-600">당신의 노후 생활비 진단 결과입니다</p>
        </div>

        {/* 메인 결과 카드 */}
        <div className="card mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 월 생활비 분석</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">일간 생활비</div>
                <div className="text-2xl font-bold text-blue-800">
                  {formatResultAmount(calculatorResult.dailyAmount)}
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <div className="text-sm text-green-600 mb-1">월간 생활비</div>
                <div className="text-3xl font-bold text-green-800">
                  {formatResultAmount(calculatorResult.monthlyAmount)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="text-sm text-purple-600 mb-1">연간 생활비</div>
                <div className="text-2xl font-bold text-purple-800">
                  {formatResultAmount(calculatorResult.annualAmount)}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <div className="text-left">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">💡 결과 해석</h3>
                <p className="text-yellow-800">
                  현재 자산으로 {calculatorResult.yearsToLive}년간 ({lifeExpectancy}세까지) 
                  <strong>월 {formatResultAmount(calculatorResult.monthlyAmount)}</strong>의 생활비를 사용할 수 있습니다.
                </p>
                {calculatorResult.safetyLevel === '주의' && (
                  <p className="text-red-600 mt-2 font-semibold">
                    ⚠️ 월 생활비가 다소 부족할 수 있습니다. 추가 준비를 고려해보세요.
                  </p>
                )}
                {calculatorResult.safetyLevel === '안전' && (
                  <p className="text-green-600 mt-2 font-semibold">
                    ✅ 비교적 안정적인 노후 생활이 가능한 수준입니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 전문가 상담 연계 섹션 */}
        <div className="card">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                💡 더 정확한 노후 계획이 필요하시다면?
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                검증된 금융 전문가와 1:1 상담을 받아보세요.<br/>
                계산 결과를 바탕으로 맞춤형 재무 설계 조언을 받을 수 있습니다.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold text-gray-800">맞춤형 분석</div>
                  <div className="text-gray-600 text-sm">개인 상황 기반 정밀 분석</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-semibold text-gray-800">투자 전략</div>
                  <div className="text-gray-600 text-sm">안전한 노후 자금 운용법</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold text-gray-800">실행 계획</div>
                  <div className="text-gray-600 text-sm">단계별 준비 로드맵</div>
                </div>
              </div>
              
              {/* 단계별 액션 버튼 */}
              <div className="flex gap-4 justify-center mb-4">
                <button 
                  onClick={handleExpenseInput}
                  className="btn-primary text-lg px-6 py-3"
                >
                  📊 또래와 비교해보기
                </button>
                
                <button 
                  className="border border-gray-300 text-lg px-6 py-3 rounded-lg hover:bg-gray-50"
                  onClick={onExpertConsultation}
                >
                  💼 전문가 상담
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                💡 또래 비교를 하면 더 정확한 분석을 받을 수 있습니다
              </p>
              
              <p className="text-gray-500 mt-4 text-sm">
                CFP/AFP 자격을 가진 검증된 전문가와 익명으로 상담받으세요
              </p>
            </div>
          </div>
        </div>

        {/* 새로 계산하기 버튼 */}
        <div className="text-center mt-8">
          <button
            onClick={onReset}
            className="border border-gray-300 px-8 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            🔄 새로 계산하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Results;