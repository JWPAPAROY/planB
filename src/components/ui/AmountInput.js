import React from 'react';
import { formatAmount } from '../../utils/formatters.js';

// AmountInput 컴포넌트 (기능과 UI 완전 보존)
export const AmountInput = ({ label, value, onChange, placeholder, averageAmount }) => (
  <div className="mb-6">
    <label className="block text-xl font-semibold text-gray-800 mb-3">{label}</label>
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => {
        const numValue = e.target.value.replace(/[^0-9]/g, '');
        onChange(numValue === '' ? '' : numValue);
      }}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg"
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      draggable="false"
      style={{ userSelect: 'text' }}
    />
    <div className="text-green-600 font-semibold text-lg mt-1">{formatAmount(value)}</div>
    {averageAmount > 0 && (
      <div className="text-sm text-blue-600 mt-1">
        📊 내 나이또래 평균: {averageAmount.toLocaleString()}만원 (통계청 가계금융복지조사 2023)
      </div>
    )}
  </div>
);

export default AmountInput;