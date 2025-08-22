import React from 'react';
import { AmountInput } from '../../ui/AmountInput.js';

// 3단계: 부채 및 연금 컴포넌트 (UI/UX 완전 보존)
export const Step3DebtPension = ({ 
  formData, 
  averageData,
  lifeExpectancy,
  enableDownsizing,
  handleInputChange, 
  setLifeExpectancy,
  setEnableDownsizing,
  onCalculate,
  onPrevious 
}) => {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">💰 부채 및 연금</h1>
          <p className="text-xl text-gray-600">부채와 연금 정보를 입력해주세요</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-6 max-w-md mx-auto">
            <div className="bg-blue-600 h-4 rounded-full" style={{width: '100%'}}></div>
          </div>
          <p className="text-lg text-gray-500 mt-3">3단계 / 3단계</p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <AmountInput
              label="💳 기타 부채 (신용대출, 카드대출 등, 단위: 만원)"
              value={formData.debt}
              onChange={(v) => handleInputChange('debt', v)}
              placeholder=""
              averageAmount={averageData?.debt || 0}
            />

            <AmountInput
              label="🏛️ 국민연금 (월 수령 예정액, 단위: 만원)"
              value={formData.nationalPension}
              onChange={(v) => handleInputChange('nationalPension', v)}
              placeholder=""
              averageAmount={0}
            />

            <AmountInput
              label="🏦 사적연금 (개인연금, 퇴직연금 등 월 수령액, 단위: 만원)"
              value={formData.privatePension}
              onChange={(v) => handleInputChange('privatePension', v)}
              placeholder=""
              averageAmount={0}
            />

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <label className="text-lg font-semibold">🏠 주택 매각 고려</label>
                <input
                  type="checkbox"
                  checked={enableDownsizing}
                  onChange={(e) => setEnableDownsizing(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <p className="text-gray-700">
                노후에 현재 주택을 매각하여 작은 집으로 이주할 계획이 있으시면 체크해주세요. 
                (매각 시 양도세와 수수료 25%를 차감하여 계산됩니다)
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <label className="block text-lg font-semibold text-gray-800 mb-3">👴 기대 수명</label>
              <select
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
                value={lifeExpectancy}
                onChange={(e) => setLifeExpectancy(parseInt(e.target.value))}
              >
                <option value={95}>95세 (보수적)</option>
                <option value={100}>100세 (평균적)</option>
                <option value={105}>105세 (장수형)</option>
              </select>
              <p className="text-gray-600 mt-2">
                통계청 생명표 기준 한국인 평균 기대수명을 참고하여 선택하세요.
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={onPrevious}
                className="border border-gray-300 px-6 py-3 rounded-lg flex-1"
              >
                ← 이전 단계
              </button>
              <button
                onClick={onCalculate}
                className="btn-primary flex-1"
              >
                🧮 계산하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3DebtPension;