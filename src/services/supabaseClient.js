// 브라우저 환경에서 Supabase 사용 (추후 CDN 또는 ES 모듈로 업그레이드)
import { 
  getBrowserSupabaseConfig, 
  TABLES, 
  FIELD_MAPPINGS,
  generateUserHash,
  getAgeGroup,
  getAssetBadge,
  checkSupabaseAvailability
} from '../config/supabase.js';

// Supabase 클라이언트 초기화 (브라우저 환경)
let supabase = null;

const initializeSupabase = () => {
  if (!checkSupabaseAvailability()) {
    console.warn('Supabase 라이브러리를 사용할 수 없습니다. 목 데이터를 사용합니다.');
    return null;
  }
  
  const config = getBrowserSupabaseConfig();
  
  // 브라우저 환경에서 createClient 사용 (추후 실제 CDN 로드 시 사용)
  if (typeof window !== 'undefined' && window.createClient) {
    return window.createClient(config.url, config.anonKey);
  }
  
  // 하드코딩된 mock 클라이언트 (개발용)
  console.log('Supabase Mock 클라이언트를 사용합니다.');
  return createMockClient();
};

// Mock Supabase 클라이언트 (개발/테스트용)
const createMockClient = () => ({
  from: (table) => ({
    insert: (data) => ({ 
      select: () => Promise.resolve({ 
        data: data.map(item => ({ id: generateUserHash(), ...item })),
        error: null 
      })
    }),
    select: (columns) => ({ 
      eq: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
      range: () => ({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null })
    })
  })
});

// 전역 Supabase 인스턴스
supabase = initializeSupabase();

// 사용자 계산 데이터 저장 (익명) - SQL 스키마에 맞게 수정
export const saveCalculationData = async (calculationData) => {
  try {
    if (!supabase) {
      console.warn('계산 데이터를 로컸 저장소에 임시 저장합니다.');
      return saveToLocalStorage('calculation_data', calculationData);
    }
    
    // SQL 스키마에 맞는 데이터 구조
    const userHash = generateUserHash();
    const ageGroup = getAgeGroup(calculationData.age || 65);
    
    // 총 자산 계산 (모든 자산 합계)
    const financialAssets = parseInt(calculationData.financialAssets || 0) * 10000;
    const severancePay = parseInt(calculationData.severancePay || 0) * 10000;
    const homeValue = parseInt(calculationData.homeValue || 0) * 10000;
    const totalAssets = financialAssets + severancePay + homeValue;
    
    const insertData = {
      user_hash: userHash,
      age: parseInt(calculationData.age) || null,
      age_group: ageGroup,
      health_status: calculationData.health || null,
      life_mode: calculationData.mode || null,
      housing_type: calculationData.housingType || null,
      housing_value: homeValue || null,
      financial_assets: financialAssets || null,
      severance_pay: severancePay || null,
      debt: parseInt(calculationData.debt || 0) * 10000 || null,
      national_pension: parseInt(calculationData.nationalPension || 0) * 10000 || null,
      private_pension: parseInt(calculationData.privatePension || 0) * 10000 || null,
      calculation_result: {
        ...calculationData,
        totalAssets,
        ageGroup,
        savedAt: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from(TABLES.USER_CALCULATIONS)
      .insert([insertData])
      .select();

    if (error) throw error;
    
    console.log('계산 데이터 저장 성공:', data[0]?.id);
    return data[0];
  } catch (error) {
    console.error('계산 데이터 저장 실패:', error);
    // 대안: 로컸 저장소에 저장
    return saveToLocalStorage('calculation_data', calculationData);
  }
};

// 지출 내역 저장 - SQL 스키마에 맞게 수정
export const saveExpenseData = async (calculationId, expenseData) => {
  try {
    if (!supabase || !calculationId) {
      console.warn('지출 데이터를 로컸 저장소에 임시 저장합니다.');
      return saveToLocalStorage('expense_data', { calculationId, ...expenseData });
    }
    
    // SQL 스키마에 맞는 데이터 구조
    const insertData = {
      calculation_id: calculationId,
      food_expenses: parseInt(expenseData.food || 0),
      communication_expenses: parseInt(expenseData.communication || 0),
      utilities_expenses: parseInt(expenseData.utilities || 0),
      living_expenses: parseInt(expenseData.living || 0),
      medical_expenses: parseInt(expenseData.medical || 0),
      hobby_expenses: parseInt(expenseData.hobby || 0),
      total_monthly_expenses: Object.values(expenseData).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
    };

    const { data, error } = await supabase
      .from(TABLES.USER_EXPENSES)
      .insert([insertData])
      .select();

    if (error) throw error;
    
    console.log('지출 데이터 저장 성공:', data[0]?.id);
    return data[0];
  } catch (error) {
    console.error('지출 데이터 저장 실패:', error);
    return saveToLocalStorage('expense_data', { calculationId, ...expenseData });
  }
};

// 또래 비교 데이터 조회 - SQL 스키마에 맞게 수정
export const getPeerComparisonData = async (ageGroup, assetBadge) => {
  try {
    if (!supabase) {
      console.warn('Supabase 연결 없음, 샘플 데이터 반환');
      return null; // PeerComparison 컴포넌트에서 샘플 데이터 생성
    }
    
    // SQL 스키마에 맞는 JOIN 쿼리
    const { data, error } = await supabase
      .from(TABLES.USER_EXPENSES)
      .select(`
        food_expenses,
        communication_expenses,
        utilities_expenses,
        living_expenses,
        medical_expenses,
        hobby_expenses,
        user_calculations!inner(age_group, housing_value, financial_assets, severance_pay)
      `)
      .eq('user_calculations.age_group', ageGroup);

    if (error) {
      console.warn('또래 비교 쿼리 실패:', error);
      return null; // 실패시 샘플 데이터 사용
    }

    // 자산 구간으로 추가 필터링 (클라이언트 측에서 처리) - import된 getAssetBadge 사용
    const { getAssetBadge } = await import('../config/supabase.js');
    
    const filteredData = data?.filter(item => {
      const calc = item.user_calculations;
      const totalAssets = (calc.housing_value || 0) + (calc.financial_assets || 0) + (calc.severance_pay || 0);
      const userAssetBadge = getAssetBadge(totalAssets);
      return userAssetBadge === assetBadge;
    }) || [];

    console.log(`또래 비교 데이터: ${filteredData.length}명 (${ageGroup}, ${assetBadge})`);

    // 데이터가 충분하지 않은 경우 null 반환 (샘플 데이터 사용)
    if (filteredData.length < 3) {
      console.log('또래 데이터 부족, 샘플 데이터 사용');
      return null;
    }

    // 평균값 계산 (SQL 필드명에 맞게 수정)
    const averages = {
      food: Math.round(filteredData.reduce((sum, item) => sum + (item.food_expenses || 0), 0) / filteredData.length),
      communication: Math.round(filteredData.reduce((sum, item) => sum + (item.communication_expenses || 0), 0) / filteredData.length),
      utilities: Math.round(filteredData.reduce((sum, item) => sum + (item.utilities_expenses || 0), 0) / filteredData.length),
      living: Math.round(filteredData.reduce((sum, item) => sum + (item.living_expenses || 0), 0) / filteredData.length),
      medical: Math.round(filteredData.reduce((sum, item) => sum + (item.medical_expenses || 0), 0) / filteredData.length),
      hobby: Math.round(filteredData.reduce((sum, item) => sum + (item.hobby_expenses || 0), 0) / filteredData.length),
      sampleSize: filteredData.length
    };

    return averages;
  } catch (error) {
    console.error('또래 비교 데이터 조회 실패:', error);
    return null; // 에러시 샘플 데이터 사용
  }
};

// 전문가 목록 조회
export const getExpertsByService = async (serviceType, criteria = {}) => {
  try {
    let query = supabase
      .from(TABLES.FINANCIAL_EXPERTS)
      .select('*')
      .eq('status', 'active')
      .eq('is_verified', true)

    // 서비스 타입별 필터링
    if (serviceType === 'FINANCIAL') {
      query = query.contains('specializations', ['노후설계', '자산관리', '재무설계'])
    } else if (serviceType === 'HEALTH') {
      query = query.contains('specializations', ['건강관리', '영양상담', '운동처방'])
    } else if (serviceType === 'ESTATE') {
      query = query.contains('specializations', ['상속설계', '부동산', '세무'])
    }

    // 가격대 필터링
    if (criteria.priceRange) {
      query = query
        .gte('hourly_rate', criteria.priceRange.min)
        .lte('hourly_rate', criteria.priceRange.max)
    }

    // 평점순 정렬
    query = query.order('rating_average', { ascending: false })

    const { data, error } = await query.limit(10)

    if (error) throw error
    return data
  } catch (error) {
    console.error('전문가 목록 조회 실패:', error)
    throw error
  }
}

// 상담 세션 생성
export const createConsultationSession = async (sessionData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CONSULTATION_SESSIONS)
      .insert([
        {
          user_calculation_id: sessionData.calculationId,
          expert_id: sessionData.expertId,
          user_hash: generateUserHash(), // 익명 식별자
          consultation_type: sessionData.consultationType,
          scheduled_at: sessionData.scheduledAt,
          duration_minutes: sessionData.duration || 60,
          price_paid: sessionData.price
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('상담 세션 생성 실패:', error)
    throw error
  }
}

// 상담 후기 저장
export const saveConsultationReview = async (reviewData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CONSULTATION_REVIEWS)
      .insert([
        {
          session_id: reviewData.sessionId,
          rating: reviewData.rating,
          review_text: reviewData.reviewText
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('상담 후기 저장 실패:', error)
    throw error
  }
}

// 커뮤니티 게시글 조회
export const getCommunityPosts = async (limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMMUNITY_POSTS)
      .select(`
        *,
        community_replies(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  } catch (error) {
    console.error('커뮤니티 게시글 조회 실패:', error)
    throw error
  }
}

// 커뮤니티 게시글 작성
export const createCommunityPost = async (postData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMMUNITY_POSTS)
      .insert([
        {
          user_hash: generateUserHash(),
          title: postData.title,
          content: postData.content,
          category: postData.category || 'general',
          asset_badge: postData.assetBadge,
          age_badge: postData.ageBadge,
          region_badge: postData.regionBadge
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('커뮤니티 게시글 작성 실패:', error)
    throw error
  }
}

// 로컸 저장소 백업 기능 (Supabase 연결 실패 시 사용)
const saveToLocalStorage = (key, data) => {
  try {
    const storageKey = `planb_${key}_${Date.now()}`;
    const storageData = {
      id: generateUserHash(),
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };
    localStorage.setItem(storageKey, JSON.stringify(storageData));
    console.log(`데이터를 로컸 저장소에 저장: ${storageKey}`);
    return storageData;
  } catch (error) {
    console.error('로컸 저장소 저장 실패:', error);
    return { id: generateUserHash(), data, error: error.message };
  }
};

const getFromLocalStorage = (keyPrefix) => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`planb_${keyPrefix}`));
    return keys.map(key => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('로컸 저장소 조회 실패:', error);
    return [];
  }
};

// Supabase 연결 상태 확인
export const checkSupabaseConnection = async () => {
  if (!supabase) return false;
  
  try {
    // 간단한 연결 테스트
    const { error } = await supabase.from('user_calculations').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase 연결 테스트 실패:', error);
    return false;
  }
};

// 전역 에러 핸들러
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('supabase')) {
    console.warn('Supabase 오류를 무시하고 로컸 저장소를 사용합니다:', event.reason);
    event.preventDefault();
  }
});

export default supabase;

// 디버그 정보
export const getDebugInfo = () => ({
  supabaseAvailable: !!supabase,
  localStorageItems: getFromLocalStorage('calculation').length + getFromLocalStorage('expense').length,
  browserEnvironment: typeof window !== 'undefined',
  timestamp: new Date().toISOString()
});