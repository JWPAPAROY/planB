const { expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://iopidkmpoxcctixchkmv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcGlka21wb3hjY3RpeGNoa212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMjE5NDUsImV4cCI6MjAzOTc5Nzk0NX0.YPJGb6Atk6IfLEDEn8jF11JL7qIcq7dGhPBSqgA_uf8';

const supabase = createClient(supabaseUrl, supabaseKey);

class TestHelpers {
  /**
   * 테스트용 더미 사용자 생성
   */
  static generateTestUser() {
    const timestamp = Date.now();
    return {
      email: `test.user.${timestamp}@planb-test.com`,
      password: 'TestPassword123!',
      nickname: `테스트유저${timestamp}`,
      phone: '010-1234-5678'
    };
  }

  /**
   * 테스트용 전문가 데이터 생성
   */
  static generateTestExpert() {
    const timestamp = Date.now();
    return {
      email: `test.expert.${timestamp}@planb-test.com`,
      password: 'ExpertPassword123!',
      nickname: `테스트전문가${timestamp}`,
      expertType: 'legal',
      expertTitle: '테스트 세무 전문가',
      experienceYears: '5',
      hourlyRate: '100000',
      phone: '010-9876-5432',
      businessLicense: '123-45-67890',
      qualificationNumber: 'TEST-12345',
      bio: '테스트용 전문가 프로필입니다.',
      specialties: ['세무상담', '자산관리'],
      credentials: ['공인회계사', '세무사'],
      availableTypes: ['phone', 'video']
    };
  }

  /**
   * 테스트용 계산 데이터 생성
   */
  static generateTestCalculation() {
    return {
      age: '55',
      health: '보통',
      mode: '균형',
      housingType: 'owned_living',
      financialAssets: '500000000',
      severancePay: '100000000',
      homeValue: '800000000',
      homeMortgage: '200000000',
      homeMortgageInterest: '3.5',
      nationalPension: '1200000',
      privatePension: '800000',
      monthlyExpenses: {
        food: 800000,
        utilities: 200000,
        transportation: 300000,
        healthcare: 400000,
        leisure: 500000,
        insurance: 300000,
        other: 200000
      }
    };
  }

  /**
   * 페이지 로드 대기
   */
  static async waitForPageLoad(page, timeout = 30000) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => {
      return window.React && window.ReactDOM;
    }, { timeout });
    
    // React 앱이 완전히 로드될 때까지 대기
    await page.waitForSelector('#root > div', { timeout });
  }

  /**
   * Supabase 연결 테스트
   */
  static async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 테스트 데이터 정리
   */
  static async cleanupTestData() {
    try {
      // 테스트용 이메일 패턴으로 데이터 삭제
      const { error: profilesError } = await supabase
        .from('user_profiles')
        .delete()
        .like('email', '%@planb-test.com');

      const { error: calculationsError } = await supabase
        .from('user_calculations')
        .delete()
        .like('user_hash', 'test_%');

      const { error: postsError } = await supabase
        .from('community_posts')
        .delete()
        .like('author_nickname', '테스트%');

      return {
        success: !profilesError && !calculationsError && !postsError,
        errors: { profilesError, calculationsError, postsError }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 테스트용 관리자 계정 생성
   */
  static async createTestAdmin() {
    const adminData = {
      email: 'test.admin@planb-test.com',
      nickname: '테스트관리자',
      role: 'admin',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(adminData)
        .select();

      return { success: !error, data, error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 계산기 폼 채우기 도우미
   */
  static async fillCalculatorForm(page, data) {
    // 1단계: 기본 정보
    await page.selectOption('select[data-testid="age-select"]', data.age);
    await page.selectOption('select[data-testid="health-select"]', data.health);
    await page.selectOption('select[data-testid="mode-select"]', data.mode);
    await page.selectOption('select[data-testid="housing-type-select"]', data.housingType);

    // 다음 단계 버튼 클릭
    await page.click('button:has-text("다음 단계")');

    // 2단계: 자산 정보
    await page.fill('input[data-testid="financial-assets"]', data.financialAssets);
    await page.fill('input[data-testid="severance-pay"]', data.severancePay);
    
    if (data.housingType === 'owned_living' || data.housingType === 'owned_renting') {
      await page.fill('input[data-testid="home-value"]', data.homeValue);
      if (data.homeMortgage) {
        await page.fill('input[data-testid="home-mortgage"]', data.homeMortgage);
        await page.fill('input[data-testid="home-mortgage-interest"]', data.homeMortgageInterest);
      }
    }

    await page.click('button:has-text("다음 단계")');

    // 3단계: 연금 정보
    if (data.nationalPension) {
      await page.fill('input[data-testid="national-pension"]', data.nationalPension);
    }
    if (data.privatePension) {
      await page.fill('input[data-testid="private-pension"]', data.privatePension);
    }

    await page.click('button:has-text("다음 단계")');

    // 4단계: 지출 정보
    if (data.monthlyExpenses) {
      for (const [key, value] of Object.entries(data.monthlyExpenses)) {
        await page.fill(`input[data-testid="expense-${key}"]`, value.toString());
      }
    }

    // 계산하기 버튼 클릭
    await page.click('button:has-text("은퇴생활비 계산하기")');
  }

  /**
   * 로그인 도우미
   */
  static async login(page, email, password) {
    await page.click('button:has-text("로그인")');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]:has-text("로그인")');
    
    // 로그인 완료까지 대기
    await page.waitForSelector('text=안녕하세요', { timeout: 10000 });
  }

  /**
   * 회원가입 도우미
   */
  static async signup(page, userData) {
    await page.click('button:has-text("회원가입")');
    await page.fill('input[type="email"]', userData.email);
    await page.fill('input[type="password"]', userData.password);
    await page.fill('input[data-testid="confirm-password"]', userData.password);
    
    // 닉네임 설정
    if (userData.nickname) {
      await page.check('input[type="checkbox"][data-testid="use-custom-nickname"]');
      await page.fill('input[data-testid="custom-nickname"]', userData.nickname);
    }

    // 개인정보 동의
    await page.check('input[type="checkbox"][data-testid="privacy-consent"]');
    
    await page.click('button[type="submit"]:has-text("가입하기")');
    
    // 회원가입 완료까지 대기
    await page.waitForSelector('text=회원가입이 완료되었습니다', { timeout: 10000 });
  }

  /**
   * WebRTC 연결 테스트 도우미
   */
  static async testWebRTCConnection(page) {
    // 사용자 미디어 권한 허용 (테스트 환경)
    await page.context().grantPermissions(['microphone', 'camera']);
    
    // WebRTC 연결 상태 확인
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        const pc = new RTCPeerConnection(configuration);
        
        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected') {
            resolve({ success: true, state: pc.iceConnectionState });
            pc.close();
          } else if (pc.iceConnectionState === 'failed') {
            resolve({ success: false, state: pc.iceConnectionState });
            pc.close();
          }
        };

        // 테스트용 더미 offer 생성
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
        });

        // 타임아웃
        setTimeout(() => {
          resolve({ success: false, state: 'timeout' });
          pc.close();
        }, 10000);
      });
    });
  }

  /**
   * 성능 메트릭 수집
   */
  static async collectPerformanceMetrics(page) {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalPageSize: navigation.transferSize || 0
      };
    });
  }

  /**
   * 모바일 뷰포트 테스트
   */
  static async testMobileViewport(page) {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    // 모바일 최적화 요소 확인
    const mobileElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      const touchElements = document.querySelectorAll('button, [role="button"], a');
      
      let touchSizeIssues = 0;
      touchElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          touchSizeIssues++;
        }
      });

      return {
        responsiveElements: elements.length,
        touchSizeIssues,
        totalTouchElements: touchElements.length
      };
    });

    return mobileElements;
  }
}

module.exports = TestHelpers;