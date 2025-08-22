import React from 'react';
import { AmountInput } from '../../ui/AmountInput.js';

// 2단계: 자산 정보 컴포넌트 (UI/UX 완전 보존)
export const Step2AssetInfo = ({ 
  formData, 
  averageData,
  handleInputChange, 
  onNext,
  onPrevious 
}) => {
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

            {/* 주거형태별 조건부 필드 */}
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

            <div className="flex gap-4 mt-8">
              <button
                onClick={onPrevious}
                className="border border-gray-300 px-6 py-3 rounded-lg flex-1"
              >
                ← 이전 단계
              </button>
              <button
                onClick={onNext}
                className="btn-primary flex-1"
                disabled={!formData.housingType}
              >
                다음 단계 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2AssetInfo;