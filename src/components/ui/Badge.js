// 재사용 가능한 뱃지 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // default, success, warning, error, info
  size = 'default', // sm, default, lg
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full border';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    // 커뮤니티 전용 스타일들
    anonymous: 'bg-gray-500 text-white border-gray-600',
    asset: 'bg-blue-500 text-white border-blue-600',
    region: 'bg-orange-500 text-white border-orange-600'
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};