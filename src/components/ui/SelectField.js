// 재사용 가능한 선택 필드 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const SelectField = ({
  label,
  icon,
  value,
  onChange,
  options = [],
  placeholder = '선택해주세요',
  className = '',
  required = false,
  description,
  error,
  ...props
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* 라벨 */}
      {label && (
        <label className="block text-xl font-semibold text-gray-800 mb-3">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* 설명 */}
      {description && (
        <p className="text-gray-600 mb-3 text-sm">{description}</p>
      )}
      
      {/* 선택 필드 */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-4 border-2 rounded-lg text-lg transition-all ${
          error 
            ? 'border-red-300 focus:border-red-500' 
            : 'border-gray-200 focus:border-blue-500'
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};