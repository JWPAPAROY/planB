import React, { useState, useEffect } from 'react';
import { CommunityPosts } from './CommunityPosts.js';
import { CommunityWrite } from './CommunityWrite.js';
import { CommunityProfile } from './CommunityProfile.js';

// 리팩토링된 커뮤니티 허브 컴포넌트 (기능과 UI 완전 보존)
export const CommunityHub = () => {
  // 기존 state들 보존
  const [communityTab, setCommunityTab] = useState('posts');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');
  const [expenseData, setExpenseData] = useState({
    food: '',
    communication: '',
    utilities: '',
    living: '',
    medical: '',
    hobby: ''
  });
  const [posts, setPosts] = useState([]);

  // 기존 샘플 데이터 보존 (나중에 Supabase에서 가져올 예정)
  const samplePosts = [
    {
      id: 1,
      title: "65세 퇴직 후 월 300만원으로 살 수 있을까요?",
      content: "남편과 함께 서울 아파트(시세 8억)에 살고 있고, 예금은 2억 정도 있습니다. 국민연금은 월 120만원 정도 나올 예정인데, 이 정도면 노후생활이 가능할까요?",
      preview: "남편과 함께 서울 아파트(시세 8억)에 살고 있고, 예금은 2억 정도 있습니다...",
      assetBadge: "2-5억",
      regionBadge: "서울",
      date: "2시간 전",
      views: 156,
      replies: [
        {
          content: "저희도 비슷한 상황인데, 의료비를 더 많이 고려해보세요. 나이가 들수록 병원비가 만만치 않아요.",
          assetBadge: "2-5억",
          date: "1시간 전"
        }
      ]
    },
    {
      id: 2,
      title: "자녀에게 얼마나 물려줄지 고민됩니다",
      content: "총 자산이 10억 정도 되는데, 상속세도 걱정되고 우리가 쓸 돈도 확보해야 하고... 어떻게 계획하시나요?",
      preview: "총 자산이 10억 정도 되는데, 상속세도 걱정되고 우리가 쓸 돈도 확보해야 하고...",
      assetBadge: "10억 이상",
      regionBadge: "경기",
      date: "5시간 전",
      views: 89,
      replies: []
    },
    {
      id: 3,
      title: "요양원 vs 재가요양, 어떤 게 나을까요?",
      content: "어머니가 치매 초기 진단을 받으셨는데, 요양원에 모실지 집에서 요양보호사를 모실지 고민입니다. 비용과 케어의 질을 모두 고려해야 하는데...",
      preview: "어머니가 치매 초기 진단을 받으셨는데, 요양원에 모실지 집에서 요양보호사를 모실지...",
      assetBadge: "5천만-2억",
      regionBadge: "부산",
      date: "1일 전",
      views: 234,
      replies: [
        {
          content: "저희는 재가요양을 선택했는데, 익숙한 환경에서 지내시니 어머니가 더 안정되시는 것 같아요.",
          assetBadge: "2-5억",
          date: "18시간 전"
        },
        {
          content: "비용 측면에서는 요양원이 더 경제적일 수 있어요. 하지만 케어의 질은 케이스바이케이스인 것 같습니다.",
          assetBadge: "5-10억",
          date: "12시간 전"
        }
      ]
    }
  ];

  // 기존 지출 내역 처리 함수들 보존
  const handleExpenseChange = (field, value) => {
    setExpenseData({ ...expenseData, [field]: value });
  };

  const submitExpenseData = () => {
    alert('지출내역이 저장되었습니다! 이제 비슷한 사람들의 지출 패턴을 확인할 수 있습니다.');
    setShowExpenseModal(false);
  };

  const openExpenseModal = () => {
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
  };

  // 새 게시글 작성 처리
  const handlePostSubmit = (postData) => {
    setPosts([postData, ...posts]);
    setCommunityTab('posts'); // 작성 후 게시글 목록으로 이동
  };

  // 전체 게시글 목록 (샘플 + 사용자 작성)
  const allPosts = [...posts, ...samplePosts];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 탭 네비게이션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            <button 
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                communityTab === 'posts' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setCommunityTab('posts')}
            >
              📝 게시글
            </button>
            <button 
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                communityTab === 'write' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setCommunityTab('write')}
            >
              ✍️ 글쓰기
            </button>
            <button 
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                communityTab === 'myprofile' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setCommunityTab('myprofile')}
            >
              👤 내 프로필
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {communityTab === 'posts' && (
        <CommunityPosts samplePosts={allPosts} />
      )}
      
      {communityTab === 'write' && (
        <CommunityWrite onPostSubmit={handlePostSubmit} />
      )}
      
      {communityTab === 'myprofile' && (
        <CommunityProfile />
      )}

      {/* 지출 내역 입력 모달 (기존 기능 보존) */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">월 지출 내역 입력</h3>
              <p className="text-gray-600 mb-6">
                입력하시면 비슷한 또래분들의 지출 패턴을 확인할 수 있어요
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">🍚 식비</label>
                  <input
                    type="number"
                    value={expenseData.food}
                    onChange={(e) => handleExpenseChange('food', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">📱 통신비</label>
                  <input
                    type="number"
                    value={expenseData.communication}
                    onChange={(e) => handleExpenseChange('communication', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">🏠 주거/관리비</label>
                  <input
                    type="number"
                    value={expenseData.utilities}
                    onChange={(e) => handleExpenseChange('utilities', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">🛍️ 생활비</label>
                  <input
                    type="number"
                    value={expenseData.living}
                    onChange={(e) => handleExpenseChange('living', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">🏥 의료비</label>
                  <input
                    type="number"
                    value={expenseData.medical}
                    onChange={(e) => handleExpenseChange('medical', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">🎨 취미/여가비</label>
                  <input
                    type="number"
                    value={expenseData.hobby}
                    onChange={(e) => handleExpenseChange('hobby', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="만원 단위로 입력"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button 
                  className="btn-primary flex-1"
                  onClick={submitExpenseData}
                >
                  저장하기
                </button>
                <button 
                  className="border border-gray-300 px-6 py-3 rounded-lg"
                  onClick={closeExpenseModal}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;