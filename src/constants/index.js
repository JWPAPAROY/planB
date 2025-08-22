// 기존 계산기 상수들 보존
export const HOUSING_TYPES = {
  owned_living: '자가 소유 + 거주',
  owned_renting: '자가 소유 + 전세/월세 거주',
  jeonse: '전세',
  monthly: '월세',
  none: '무주택'
};

export const HEALTH_STATUS = {
  good: '양호',
  caution: '주의필요'
};

export const LIFE_MODE = {
  conservative: '보수적',
  balanced: '균형',
  aggressive: '적극적'
};

// 플랜비 5대 카테고리 시스템 (우선순위 순)
export const PLANB_CATEGORIES = {
  TRAVEL_HOBBY: {
    id: 'travel_hobby',
    name: '여행/취미',
    icon: '✈️',
    description: '시니어 여행, 취미활동, 평생학습',
    experts: ['여행플래너', '취미강사', '평생교육사'],
    priceRange: { min: 20000, max: 50000 }
  },
  FAMILY_RELATIONSHIP: {
    id: 'family_relationship', 
    name: '가족/관계',
    icon: '👨‍👩‍👧‍👦',
    description: '가족소통, 부부관계, 인간관계',
    experts: ['상담사', '심리전문가', '관계코치'],
    priceRange: { min: 30000, max: 80000 }
  },
  HEALTHCARE: {
    id: 'healthcare',
    name: '헬스케어', 
    icon: '🏥',
    description: '건강관리, 영양, 운동, 만성질환 관리',
    experts: ['간호사', '영양사', '운동처방사'],
    priceRange: { min: 20000, max: 60000 }
  },
  FINANCIAL: {
    id: 'financial',
    name: '금융설계',
    icon: '💰', 
    description: '연금, 투자, 세금절약, 자산관리',
    experts: ['CFP', 'AFP', '재무설계사', '세무사'],
    priceRange: { min: 30000, max: 100000 }
  },
  HOUSING_ESTATE: {
    id: 'housing_estate',
    name: '주거/부동산',
    icon: '🏠',
    description: '노후주거, 부동산 정리, 상속준비',
    experts: ['부동산전문가', '공인중개사', '상속전문가'],
    priceRange: { min: 50000, max: 200000 }
  }
};

// 기존 호환성을 위한 서비스 매핑
export const PLATFORM_SERVICES = {
  TRAVEL_HOBBY: PLANB_CATEGORIES.TRAVEL_HOBBY.id,
  FAMILY_RELATIONSHIP: PLANB_CATEGORIES.FAMILY_RELATIONSHIP.id,
  HEALTHCARE: PLANB_CATEGORIES.HEALTHCARE.id,
  FINANCIAL: PLANB_CATEGORIES.FINANCIAL.id,
  HOUSING_ESTATE: PLANB_CATEGORIES.HOUSING_ESTATE.id
};

export const EXPERT_TYPES = {
  // 금융 전문가
  CFP: 'cfp',
  AFP: 'afp',
  FINANCIAL_PLANNER: 'financial_planner',
  
  // 건강 전문가  
  NURSE: 'nurse',
  NUTRITIONIST: 'nutritionist',
  EXERCISE_SPECIALIST: 'exercise_specialist',
  COUNSELOR: 'counselor',
  
  // 부동산/법률 전문가
  TAX_ACCOUNTANT: 'tax_accountant',
  ESTATE_LAWYER: 'estate_lawyer',
  REAL_ESTATE_AGENT: 'real_estate_agent',
  
  // 생활지원 전문가
  IT_SUPPORTER: 'it_supporter',
  CARE_WORKER: 'care_worker',
  SOCIAL_WORKER: 'social_worker'
};

export const CONSULTATION_TYPES = {
  TEXT: 'text',
  VOICE: 'voice', 
  VIDEO: 'video',
  VISIT: 'visit'
};

export const CONSULTATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};