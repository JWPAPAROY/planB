// 커뮤니티 프로필 컴포넌트 (기존 UI/UX 완전 보존)
import React from 'react';

export const CommunityProfile = () => {
  // localStorage에서 프로필 정보 가져오기
  const profile = JSON.parse(localStorage.getItem('planb_profile') || '{}');

  const formatAmount = (amount) => {
    if (!amount) return '0원';
    if (amount >= 100000000) return `${Math.round(amount / 100000000)}억원`;
    if (amount >= 10000) return `${Math.round(amount / 10000)}만원`;
    return `${amount.toLocaleString()}원`;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">👤 내 프로필</h1>
          <p className="text-xl text-gray-600">커뮤니티에서 표시되는 익명 정보입니다</p>
        </div>

        <div className="card">
          {/* 프로필 헤더 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">익명 사용자</h2>
            <p className="text-gray-600 mt-2">
              {profile.joinDate ? `가입일: ${profile.joinDate}` : '계산기를 먼저 사용해보세요'}
            </p>
          </div>

          {/* 프로필 정보 */}
          {profile.age ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🎂 연령대</h4>
                  <p className="text-lg text-blue-600 font-bold">
                    {profile.age}대
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">💰 자산 구간</h4>
                  <p className="text-lg text-green-600 font-bold">
                    {profile.assets || '미설정'}
                  </p>
                </div>
              </div>

              {/* 라이프스타일 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🏃‍♂️ 건강상태</h4>
                  <p className="text-lg font-bold">
                    {profile.health || '보통'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🎯 생활모드</h4>
                  <p className="text-lg font-bold">
                    {profile.lifestyle || '균형'}
                  </p>
                </div>
              </div>

              {/* 노후 계획 */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-4">📊 나의 노후 계획</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">월 예상 생활비</span>
                    <span className="font-bold text-blue-800">
                      {formatAmount(profile.monthlyRetirementBudget * 10000)}
                    </span>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-blue-600 text-sm">
                      💡 계산기 결과를 바탕으로 한 예상 금액입니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 커뮤니티 뱃지 정보 */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-4">🏷️ 커뮤니티 표시 정보</h4>
                <div className="flex gap-2 mb-3">
                  <span className="anonymous-badge">익명</span>
                  <span className="asset-badge">{profile.assets}</span>
                  <span className="region-badge">{profile.region || '서울'}</span>
                </div>
                <p className="text-green-600 text-sm">
                  게시글과 댓글에 위와 같이 표시됩니다
                </p>
              </div>

              {/* 활동 통계 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">📈 활동 통계</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">작성한 글</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-sm text-gray-600">작성한 댓글</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-gray-600">받은 좋아요</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 프로필 미설정 상태 */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧮</div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                아직 프로필이 설정되지 않았습니다
              </h3>
              <p className="text-gray-600 mb-8">
                노후생활비 계산기를 먼저 사용해서<br/>
                커뮤니티 프로필을 생성해보세요
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                🧮 계산기로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};