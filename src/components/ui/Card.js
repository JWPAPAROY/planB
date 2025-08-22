// 재사용 가능한 카드 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'default', // default, sm, lg, none
  shadow = 'default', // default, sm, lg, none
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-100
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${hover ? 'hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};