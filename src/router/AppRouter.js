// React Router 기반 라우팅 시스템 (기존 UI/UX 완전 보존)
import React from 'react';

// 기존 컴포넌트들 import
import { CalculatorForm } from '../components/calculator/CalculatorForm.js';
import { ExpertCategorySelector } from '../components/experts/ExpertCategorySelector.js';
import { ExpertMatching } from '../components/experts/ExpertMatching.js';
import { CommunityHub } from '../components/community/CommunityHub.js';
import { MainPage } from '../pages/MainPage.js';

// React Router를 CDN으로 사용하는 경우를 위한 라우터 설정
// 실제로는 React Router DOM을 설치해서 사용해야 하지만, 
// 현재는 브라우저 직접 실행을 고려하여 state 기반 라우팅 유지

export class AppRouter {
  constructor() {
    this.routes = {
      '/': 'main',
      '/calculator': 'calculator',
      '/experts': 'expert_category',
      '/experts/:category': 'experts',
      '/community': 'community'
    };
    
    this.currentRoute = '/';
    this.params = {};
    this.listeners = [];
  }

  // 라우트 변경
  navigate(path, params = {}) {
    this.currentRoute = path;
    this.params = params;
    this.notifyListeners();
    
    // 브라우저 히스토리 업데이트 (optional)
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', `#${path}`);
    }
  }

  // 현재 라우트 가져오기
  getCurrentRoute() {
    return this.currentRoute;
  }

  // 라우트 파라미터 가져오기
  getParams() {
    return this.params;
  }

  // 라우트 변경 리스너 등록
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 리스너들에게 변경 알림
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentRoute, this.params));
  }

  // 브라우저 뒤로가기/앞으로가기 지원
  initBrowserNavigation() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1) || '/';
      this.currentRoute = hash;
      this.notifyListeners();
    });
    
    // 초기 URL 설정
    const hash = window.location.hash.slice(1) || '/';
    if (this.routes[hash]) {
      this.currentRoute = hash;
    }
  }
}