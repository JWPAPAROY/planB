import React, { useState, useEffect } from 'react';
import { EXPERT_TYPES, CONSULTATION_TYPES } from '../../constants/index.js';

// 전문가 매칭 및 상담 예약 컴포넌트
export const ExpertMatching = ({ calculatorResult, formData, serviceType = 'FINANCIAL' }) => {
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [consultationType, setConsultationType] = useState(CONSULTATION_TYPES.VIDEO);
  const [availableExperts, setAvailableExperts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('selection'); // selection, booking, payment

  // 계산 결과 기반 전문가 추천
  useEffect(() => {
    if (calculatorResult && formData) {
      loadRecommendedExperts();
    }
  }, [calculatorResult, formData, serviceType]);

  const loadRecommendedExperts = async () => {
    setLoading(true);
    try {
      // 계산 결과 분석하여 적합한 전문가 추천
      const expertCriteria = analyzeNeedsFromCalculation(calculatorResult, formData);
      
      // Supabase에서 조건에 맞는 전문가들 조회
      const experts = await fetchExpertsByService(serviceType, expertCriteria);
      setAvailableExperts(experts);
    } catch (error) {
      console.error('전문가 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 계산 결과 분석하여 전문가 추천 기준 결정
  const analyzeNeedsFromCalculation = (result, data) => {
    const criteria = {
      priority: 'medium',
      specializations: [],
      priceRange: { min: 30000, max: 100000 }
    };

    // 자산 규모에 따른 우선순위 결정
    if (result.netAssets > 500000000) { // 5억 이상
      criteria.priority = 'high';
      criteria.priceRange.max = 200000;
      criteria.specializations.push('고액자산관리');
    } else if (result.netAssets > 200000000) { // 2억 이상
      criteria.priority = 'medium';
      criteria.specializations.push('중산층자산관리');
    } else {
      criteria.priority = 'basic';
      criteria.specializations.push('일반자산관리');
    }

    // 주거형태에 따른 전문성 추가
    if (data.housingType === 'owned_living' || data.housingType === 'owned_renting') {
      criteria.specializations.push('부동산자산관리');
    }

    // 월 생활비가 부족한 경우
    if (result.monthlyAmount < 2000000) { // 월 200만원 미만
      criteria.specializations.push('절약형재무설계');
      criteria.priority = 'urgent';
    }

    return criteria;
  };

  // 서비스 타입별 전문가 조회 (실제로는 Supabase API 호출)
  const fetchExpertsByService = async (serviceType, criteria) => {
    // 임시 데이터 (실제로는 Supabase에서 조회)
    const mockExperts = {
      FINANCIAL: [
        {
          id: '1',
          name: '김재무',
          credentials: ['CFP', 'AFP'],
          experience_years: 10,
          specializations: ['노후설계', '자산배분', '세금절약'],
          rating: 4.8,
          reviewCount: 156,
          hourlyRate: 50000,
          introduction: '20년간 은퇴설계 전문으로 활동하고 있습니다.',
          availability: ['오늘 오후 2시', '내일 오전 10시', '모레 오후 4시']
        },
        {
          id: '2', 
          name: '박상담',
          credentials: ['CFP', '재무설계사1급'],
          experience_years: 15,
          specializations: ['부동산자산관리', '상속설계'],
          rating: 4.9,
          reviewCount: 203,
          hourlyRate: 80000,
          introduction: '부동산을 활용한 노후 설계에 특화되어 있습니다.',
          availability: ['오늘 오후 6시', '내일 오후 2시']
        }
      ],
      HEALTH: [
        {
          id: '3',
          name: '이간호사',
          credentials: ['간호사', '건강관리사'],
          experience_years: 8,
          specializations: ['시니어건강관리', '만성질환관리'],
          rating: 4.7,
          reviewCount: 89,
          hourlyRate: 30000,
          introduction: '시니어 맞춤 건강관리 상담을 제공합니다.',
          availability: ['오늘 오후 3시', '내일 오전 11시']
        }
      ]
    };

    return mockExperts[serviceType] || [];
  };

  // 전문가 선택
  const handleExpertSelect = (expert) => {
    setSelectedExpert(expert);
    setStep('booking');
  };

  // 상담 예약
  const handleBookConsultation = async (scheduleTime) => {
    try {
      setLoading(true);
      
      // Supabase에 상담 세션 생성
      const session = await createConsultationSession({
        expertId: selectedExpert.id,
        consultationType,
        scheduledAt: scheduleTime,
        price: selectedExpert.hourlyRate,
        userCalculationData: { result: calculatorResult, formData }
      });

      setStep('payment');
    } catch (error) {
      console.error('예약 실패:', error);
      alert('예약에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Supabase 상담 세션 생성 (실제 구현 필요)
  const createConsultationSession = async (sessionData) => {
    // 실제로는 Supabase API 호출
    console.log('Creating consultation session:', sessionData);
    return { id: 'session_' + Date.now() };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">전문가를 찾고 있습니다...</div>
      </div>
    );
  }

  return (
    <div className="expert-matching-container">
      {step === 'selection' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            👨‍💼 추천 전문가 목록
          </h2>
          
          {/* 계산 결과 기반 맞춤 추천 메시지 */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-blue-800 mb-2">💡 맞춤 추천</h3>
            <p className="text-blue-700">
              회원님의 자산 {Math.floor(calculatorResult?.netAssets / 100000000 || 0)}억원, 
              월 예상 생활비 {Math.floor(calculatorResult?.monthlyAmount / 10000 || 0)}만원을 기준으로 
              전문가를 추천해드립니다.
            </p>
          </div>

          <div className="grid gap-4">
            {availableExperts.map((expert) => (
              <div key={expert.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{expert.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expert.credentials.map((cert, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 text-lg">★ {expert.rating}</div>
                    <div className="text-gray-500 text-sm">후기 {expert.reviewCount}개</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{expert.introduction}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {expert.specializations.map((spec, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {expert.hourlyRate.toLocaleString()}원
                    </span>
                    <span className="text-gray-500">/시간</span>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => handleExpertSelect(expert)}
                  >
                    상담 예약하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'booking' && selectedExpert && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📅 상담 예약
          </h2>
          
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-2">선택한 전문가: {selectedExpert.name}</h3>
            <p className="text-gray-600 mb-4">{selectedExpert.introduction}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 방식
                </label>
                <select 
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value={CONSULTATION_TYPES.VIDEO}>화상 상담</option>
                  <option value={CONSULTATION_TYPES.VOICE}>전화 상담</option>
                  <option value={CONSULTATION_TYPES.TEXT}>텍스트 상담</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예약 시간
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  {selectedExpert.availability.map((time, idx) => (
                    <option key={idx} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button 
                className="btn-primary flex-1"
                onClick={() => handleBookConsultation(selectedExpert.availability[0])}
              >
                예약 확정하기 ({selectedExpert.hourlyRate.toLocaleString()}원)
              </button>
              <button 
                className="border border-gray-300 px-6 py-3 rounded-lg"
                onClick={() => setStep('selection')}
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            💳 결제 진행
          </h2>
          <p className="mb-4">토스페이먼츠 연동 예정</p>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-green-800 mb-2">예약이 완료되었습니다!</h3>
            <p className="text-green-700">
              {selectedExpert?.name} 전문가와의 상담이 예약되었습니다.
              상담 시간에 알림을 드리겠습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertMatching;