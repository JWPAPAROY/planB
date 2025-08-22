// 메인 랜딩 페이지 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';
import { PLANB_CATEGORIES } from '../constants/index.js';

export const MainPage = ({ onNavigate }) => {
  const categories = Object.values(PLANB_CATEGORIES);

  return (
    <div className="main-container">
      {/* 플랜비 메인 헤더 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          플랜비 - 즐거운 노후생활 전문가 플랫폼
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          노후생활비 계산부터 여행, 건강, 가족관계까지<br/>
          시니어의 모든 고민을 전문가와 함께 해결하세요
        </p>
      </div>

      {/* 계산기 시작 카드 */}
      <div className="max-w-md mx-auto mb-16">
        <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2" 
             onClick={() => onNavigate('/calculator')}>
          <div className="text-center">
            <div className="text-6xl mb-4">🧮</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              노후생활비 계산기
            </h3>
            <p className="text-gray-600 mb-6">
              내 자산으로 평생 얼마나 쓸 수 있는지<br/>
              정확하게 계산해보세요
            </p>
            <div className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg">
              🚀 무료로 시작하기
            </div>
          </div>
        </div>
      </div>

      {/* 5대 카테고리 전문가 상담 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          🎯 전문가 상담 서비스
        </h2>
        <p className="text-xl text-gray-600">
          시니어를 위한 맞춤형 전문가와 1:1 상담을 받아보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
        {categories.map((category) => (
          <div key={category.id} 
               className="card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
               onClick={() => onNavigate('/experts', { category: category.id })}>
            <div className="text-center">
              <div className="text-5xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {category.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 min-h-[40px]">
                {category.description}
              </p>
              <div className="text-green-600 font-semibold text-sm">
                {Math.round(category.priceRange.min / 10000)}만원부터 →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 플랜비 특징 소개 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg mb-12">
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

      {/* CTA 버튼 */}
      <div className="text-center">
        <button 
          className="btn-primary text-xl px-12 py-4"
          onClick={() => onNavigate('/calculator')}
        >
          🚀 무료 노후생활비 계산으로 시작하기
        </button>
        <p className="text-gray-500 mt-4">
          계산 후 필요시 전문가 상담을 연결해드립니다
        </p>
      </div>
    </div>
  );
};