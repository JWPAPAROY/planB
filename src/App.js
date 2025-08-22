import React, { useState, useEffect } from 'react';
import { CalculatorProvider } from './contexts/CalculatorContext.js';
import { CalculatorForm } from './components/calculator/CalculatorForm.js';
import { ExpertMatching } from './components/experts/ExpertMatching.js';
import { ExpertCategorySelector } from './components/experts/ExpertCategorySelector.js';
import { CommunityHub } from './components/community/CommunityHub.js';
import { MainPage } from './pages/MainPage.js';
import { AppRouter } from './router/AppRouter.js';
import { PLANB_CATEGORIES, PLATFORM_SERVICES } from './constants/index.js';

// 라우터 기반 리팩토링된 메인 애플리케이션 컴포넌트
export const App = () => {
  // 라우터 시스템
  const [router] = useState(new AppRouter());
  const [currentRoute, setCurrentRoute] = useState('/');
  const [routeParams, setRouteParams] = useState({});
  
  // 기존 상태들 보존
  const [calculatorResult, setCalculatorResult] = useState(null);
  const [calculatorFormData, setCalculatorFormData] = useState(null);

  // 라우터 초기화 및 리스너 설정
  useEffect(() => {
    router.initBrowserNavigation();
    router.addListener((route, params) => {
      setCurrentRoute(route);
      setRouteParams(params);
    });
  }, [router]);

  // 네비게이션 함수
  const navigate = (path, params = {}) => {
    router.navigate(path, params);
  };

  // 계산기 결과 처리 및 전문가 상담 연계
  const handleCalculatorResult = (result, formData, action) => {
    setCalculatorResult(result);
    setCalculatorFormData(formData);
    
    if (action === 'EXPERT_CONSULTATION') {
      navigate('/experts'); // 전문가 카테고리 선택으로 이동
    }
  };

  // 전문가 카테고리 선택 처리
  const handleCategorySelect = (categoryId) => {
    navigate('/experts', { category: categoryId });
  };

  // 라우트별 컨텐츠 렌더링
  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case '/':
        return <MainPage onNavigate={navigate} />;
        
      case '/calculator':
        return <CalculatorForm onResultCalculated={handleCalculatorResult} />;
        
      case '/experts':
        // 카테고리가 지정된 경우 바로 전문가 매칭으로, 아니면 카테고리 선택으로
        if (routeParams.category) {
          return (
            <ExpertMatching 
              calculatorResult={calculatorResult}
              formData={calculatorFormData}
              categoryId={routeParams.category}
            />
          );
        } else {
          return (
            <ExpertCategorySelector 
              onCategorySelect={handleCategorySelect}
              calculatorResult={calculatorResult}
            />
          );
        }
        
      case '/community':
        return <CommunityHub />;
        
      default:
        return <MainPage onNavigate={navigate} />;
    }
  };

  return (
    <CalculatorProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 상단 네비게이션 */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* 로고 */}
              <div 
                className="text-2xl font-bold text-blue-600 cursor-pointer"
                onClick={() => navigate('/')}
              >
                플랜비
              </div>

              {/* 네비게이션 메뉴 */}
              <div className="flex space-x-8">
                <button
                  className={`${currentRoute === '/calculator' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600 transition-colors`}
                  onClick={() => navigate('/calculator')}
                >
                  🧮 계산기
                </button>
                <button
                  className={`${currentRoute === '/experts' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600 transition-colors`}
                  onClick={() => navigate('/experts')}
                >
                  🎯 전문가 상담
                </button>
                <button
                  className={`${currentRoute === '/community' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-600 transition-colors`}
                  onClick={() => navigate('/community')}
                >
                  💬 커뮤니티
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderCurrentRoute()}
        </main>

        {/* 푸터 */}
        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">플랜비</h3>
              <p className="text-gray-300 mb-4">
                시니어의 든든한 노후를 위한 전문가 매칭 플랫폼
              </p>
              <div className="text-gray-400 text-sm">
                © 2025 플랜비. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CalculatorProvider>
  );
};

export default App;