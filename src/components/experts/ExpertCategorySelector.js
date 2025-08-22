// 5대 카테고리 전문가 선택 컴포넌트
import React from 'react';
import { PLANB_CATEGORIES } from '../../constants/index.js';

export const ExpertCategorySelector = ({ onCategorySelect, calculatorResult }) => {
  const categories = Object.values(PLANB_CATEGORIES);

  const formatAmount = (amount) => {
    if (amount >= 10000) return `${Math.round(amount / 10000)}만원`;
    return `${amount.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎯 전문가 상담 선택
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            즐거운 노후생활을 위한 맞춤 전문가를 만나보세요
          </p>
          
          {calculatorResult && (
            <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="font-bold text-blue-800 mb-2">💡 계산 결과 요약</h3>
              <p className="text-blue-700">
                월 생활비: <span className="font-bold">{formatAmount(calculatorResult.monthlyAmount)}</span>
              </p>
              <p className="text-blue-600 text-sm mt-2">
                계산 결과를 바탕으로 적합한 전문가를 추천해드립니다
              </p>
            </div>
          )}
        </div>

        {/* 카테고리 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
              onClick={() => onCategorySelect(category.id)}
            >
              {/* 카테고리 아이콘 */}
              <div className="text-6xl text-center mb-4">
                {category.icon}
              </div>
              
              {/* 카테고리 제목 */}
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-3">
                {category.name}
              </h3>
              
              {/* 카테고리 설명 */}
              <p className="text-gray-600 text-center mb-4 min-h-[48px]">
                {category.description}
              </p>
              
              {/* 전문가 유형 */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">👨‍💼 전문가</h4>
                <div className="flex flex-wrap gap-1">
                  {category.experts.map((expert, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {expert}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 가격 범위 */}
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">
                  {formatAmount(category.priceRange.min)} ~ {formatAmount(category.priceRange.max)}
                </div>
                <div className="text-green-500 text-sm">
                  1회 상담 기준
                </div>
              </div>
              
              {/* 추천 뱃지 (계산 결과 기반) */}
              {category.id === 'financial' && calculatorResult && (
                <div className="mt-4 text-center">
                  <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-semibold">
                    ⭐ 계산 결과 기반 추천
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🌟 플랜비 전문가 상담의 특징
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-bold text-gray-800 mb-2">시니어 특화</h4>
              <p className="text-gray-600">
                40-70대 시니어만을 위한<br/>전문 상담 서비스
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">💝</div>
              <h4 className="font-bold text-gray-800 mb-2">합리적 가격</h4>
              <p className="text-gray-600">
                기존 상담 대비 1/3 가격으로<br/>전문가와 만날 수 있어요
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="font-bold text-gray-800 mb-2">검증된 전문가</h4>
              <p className="text-gray-600">
                자격증과 경력을 검증받은<br/>신뢰할 수 있는 전문가들
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-gray-500">
            💡 여러 분야의 전문가와 상담받으실 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
};