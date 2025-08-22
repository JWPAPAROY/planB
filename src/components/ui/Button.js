// 재사용 가능한 버튼 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'default', // sm, default, lg
  disabled = false,
  loading = false,
  className = '',
  icon,
  iconPosition = 'left', // left, right
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 border-none cursor-pointer inline-flex items-center justify-center';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 hover:shadow-lg transform hover:-translate-y-0.5',
    outline: 'border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500 hover:text-white',
    ghost: 'text-blue-500 bg-transparent hover:bg-blue-50'
  };

  const disabledClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none hover:shadow-none';

  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};