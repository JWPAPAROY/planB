// 재사용 가능한 프로그레스 바 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const ProgressBar = ({
  current,
  total,
  showSteps = true,
  showPercentage = false,
  className = '',
  color = 'blue', // blue, green, orange, red
  size = 'default', // sm, default, lg
  label,
  steps = []
}) => {
  const percentage = Math.round((current / total) * 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'h-2',
    default: 'h-4',
    lg: 'h-6'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 상단 라벨 */}
      {(label || showSteps || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          <div>
            {label && (
              <span className="text-lg text-gray-500">{label}</span>
            )}
            {showSteps && (
              <span className="text-lg text-gray-500 ml-2">
                {current}단계 / {total}단계
              </span>
            )}
          </div>
          {showPercentage && (
            <span className="text-lg text-gray-500 font-medium">
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* 프로그레스 바 */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 하단 스텝 표시 */}
      {steps.length > 0 && (
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index < current 
                    ? `${colorClasses[color]} text-white` 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < current ? '✓' : index + 1}
              </div>
              <span className="text-xs text-gray-500 mt-1 text-center">
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};