import React, { useState } from 'react';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { InputField } from '../ui/InputField.js';
import { saveExpenseData } from '../../services/supabaseClient.js';

// 지출 내역 수집 컴포넌트 (또래 비교를 위한 데이터 수집)
export const ExpenseTracker = ({ 
  calculationId, 
  onExpensesSaved, 
  onSkip 
}) => {
  const [expenses, setExpenses] = useState({
    food: '',
    communication: '',
    utilities: '',
    living: '',
    medical: '',
    hobby: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const expenseCategories = [
    { key: 'food', label: '식비', icon: '🍽️', placeholder: '월 식비 (외식, 장보기 포함)' },
    { key: 'communication', label: '통신비', icon: '📱', placeholder: '휴대폰, 인터넷, TV 등' },
    { key: 'utilities', label: '공과금', icon: '⚡', placeholder: '전기, 가스, 수도, 관리비' },
    { key: 'living', label: '생활용품', icon: '🛒', placeholder: '세제, 화장품, 의류 등' },
    { key: 'medical', label: '의료비', icon: '🏥', placeholder: '병원, 약국, 건강보험료' },
    { key: 'hobby', label: '여가비', icon: '🎨', placeholder: '취미, 여행, 문화생활' }
  ];

  const handleExpenseChange = (field, value) => {
    setExpenses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveExpenses = async () => {
    setIsLoading(true);
    
    try {
      console.log('💾 지출 내역을 저장 중...');
      const savedExpense = await saveExpenseData(calculationId, expenses);
      
      console.log('✅ 지출 내역 저장 완료:', savedExpense?.id || 'localStorage');
      setIsSaved(true);
      
      // 3초 후 또래 비교 화면으로 이동
      setTimeout(() => {
        if (onExpensesSaved) {
          onExpensesSaved(expenses, savedExpense);
        }
      }, 2000);
      
    } catch (error) {
      console.error('지출 내역 저장 실패:', error);
      alert('저장에 실패했지만 또래 비교는 계속 진행됩니다.');
      
      if (onExpensesSaved) {
        onExpensesSaved(expenses, null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ 지출 내역 입력 건너뛰기');
    if (onSkip) {
      onSkip();
    }
  };

  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  const hasAnyExpense = Object.values(expenses).some(val => val && parseInt(val) > 0);

  if (isSaved) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                지출 내역이 저장되었습니다!
              </h2>
              <p className="text-gray-600 mb-6">
                익명으로 저장된 데이터는 또래 비교를 위해서만 사용됩니다.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 잠시 후 또래 비교 결과를 보여드립니다...
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            💰 월 지출 내역 입력 (선택사항)
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            또래와 비교할 수 있도록 월 지출을 입력해주세요
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <p className="text-yellow-800 text-sm">
              💡 모든 정보는 익명으로 처리되며, 통계 목적으로만 사용됩니다
            </p>
          </div>
        </div>

        <Card>
          <div className="space-y-6">
            {/* 지출 카테고리별 입력 */}
            {expenseCategories.map(category => (
              <InputField
                key={category.key}
                label={category.label}
                icon={category.icon}
                type="number"
                value={expenses[category.key]}
                onChange={(value) => handleExpenseChange(category.key, value)}
                placeholder={category.placeholder}
                suffix="만원"
              />
            ))}

            {/* 총 지출 표시 */}
            {hasAnyExpense && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="text-green-800">
                  <strong>월 총 지출: {totalExpenses.toLocaleString()}만원</strong>
                  <p className="text-sm mt-1">
                    연간 약 {(totalExpenses * 12).toLocaleString()}만원
                  </p>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1"
              >
                건너뛰기
              </Button>
              <Button
                onClick={handleSaveExpenses}
                disabled={!hasAnyExpense || isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {isLoading ? '저장 중...' : '저장하고 또래 비교하기'}
              </Button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                💡 정확한 또래 비교를 위해 가능한 모든 항목을 입력해주세요
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseTracker;