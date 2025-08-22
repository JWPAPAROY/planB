// 재사용 가능한 입력 필드 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const InputField = ({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  min,
  max,
  step,
  suffix,
  prefix,
  description,
  error,
  ...props
}) => {
  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // 숫자 입력 타입일 때 숫자만 허용
    if (type === 'number' || e.target.inputMode === 'numeric') {
      newValue = newValue.replace(/[^0-9]/g, '');
    }
    
    onChange(newValue);
  };

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
      
      {/* 입력 필드 */}
      <div className="relative">
        {/* 접두사 */}
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </div>
        )}
        
        <input
          type={type === 'number' ? 'text' : type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          pattern={type === 'number' ? '[0-9]*' : undefined}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full p-4 border-2 rounded-lg text-lg transition-all ${
            error 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-200 focus:border-blue-500'
          } ${prefix ? 'pl-12' : ''} ${suffix ? 'pr-16' : ''}`}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onDragOver={(e) => e.preventDefault()}
          {...props}
        />
        
        {/* 접미사 */}
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            {suffix}
          </div>
        )}
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};