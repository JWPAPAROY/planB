import React from 'react';
import { InputField } from '../../ui/InputField.js';
import { SelectField } from '../../ui/SelectField.js';
import { Card } from '../../ui/Card.js';
import { Button } from '../../ui/Button.js';
import { ProgressBar } from '../../ui/ProgressBar.js';

// 1단계: 기본 정보 컴포넌트 (UI/UX 완전 보존, UI 컴포넌트 적용)
export const Step1BasicInfo = ({ 
  formData, 
  handleInputChange, 
  onNext 
}) => {
  const healthOptions = [
    { value: '양호', label: '양호 (운동 규칙적, 큰 질병 없음)' },
    { value: '보통', label: '보통 (일반적인 건강 상태)' },
    { value: '주의필요', label: '주의필요 (만성질환 있거나 관리 필요)' }
  ];

  const modeOptions = [
    { value: '보수적', label: '보수적 (안전 우선, 여유자금 확보)' },
    { value: '균형', label: '균형 (평균적인 생활 수준 유지)' },
    { value: '적극적', label: '적극적 (여유있는 생활, 취미활동)' }
  ];

  const isFormValid = formData.age && formData.health && formData.mode;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">🧮 노후생활비 계산기</h1>
          <p className="text-xl text-gray-600">나이와 건강상태를 입력해주세요</p>
          
          {/* 프로그레스 바 */}
          <div className="mt-6 max-w-md mx-auto">
            <ProgressBar 
              current={1} 
              total={3} 
              showSteps={true}
              steps={['기본정보', '자산정보', '결과분석']}
            />
          </div>
        </div>

        {/* 메인 폼 카드 */}
        <Card>
          <div className="space-y-6">
            {/* 나이 입력 */}
            <InputField
              label="나이"
              icon="🎂"
              type="number"
              value={formData.age}
              onChange={(value) => handleInputChange('age', value)}
              placeholder="나이를 입력해주세요"
              required
            />

            {/* 건강상태 선택 */}
            <SelectField
              label="건강 상태"
              icon="💪"
              value={formData.health}
              onChange={(value) => handleInputChange('health', value)}
              options={healthOptions}
              required
            />

            {/* 노후 생활 모드 선택 */}
            <SelectField
              label="생활 모드"
              icon="🎯"
              value={formData.mode}
              onChange={(value) => handleInputChange('mode', value)}
              options={modeOptions}
              description="원하시는 노후 생활 스타일을 선택해주세요"
              required
            />

            {/* 다음 버튼 */}
            <Button
              onClick={onNext}
              disabled={!isFormValid}
              size="lg"
              className="w-full"
            >
              다음 단계 →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Step1BasicInfo;