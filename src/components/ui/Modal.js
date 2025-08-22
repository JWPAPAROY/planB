// 재사용 가능한 모달 컴포넌트 (기존 UI/UX 완전 보존)
import React, { useEffect } from 'react';
import { Button } from './Button.js';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'default', // sm, default, lg, xl
  closable = true,
  backdrop = true, // 배경 클릭으로 닫기
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closable, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (backdrop && closable && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      {...props}
    >
      <div 
        className={`
          bg-white rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
          transform transition-all duration-300 scale-100
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        {(title || closable) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            )}
            
            {closable && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};