// 커뮤니티 글쓰기 컴포넌트 (기존 UI/UX 완전 보존)
import React, { useState } from 'react';

export const CommunityWrite = ({ onPostSubmit }) => {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '노후생활'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 게시글 데이터 생성
    const postData = {
      ...newPost,
      assetBadge: "5천만-2억", // 실제로는 프로필에서 가져와야 함
      regionBadge: "서울",
      date: new Date().toLocaleDateString(),
      views: 0,
      replies: []
    };

    if (onPostSubmit) {
      onPostSubmit(postData);
    }

    // 폼 초기화
    setNewPost({ title: '', content: '', category: '노후생활' });
    alert('게시글이 작성되었습니다!');
  };

  const handleInputChange = (field, value) => {
    setNewPost({ ...newPost, [field]: value });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">✍️ 새 글 작성</h1>
          <p className="text-xl text-gray-600">익명으로 자유롭게 소통해보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              📂 카테고리
            </label>
            <select
              value={newPost.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg"
            >
              <option value="노후생활">🏡 노후생활</option>
              <option value="자산관리">💰 자산관리</option>
              <option value="건강관리">🏥 건강관리</option>
              <option value="여가활동">🎨 여가활동</option>
              <option value="가족관계">👨‍👩‍👧‍👦 가족관계</option>
              <option value="기타">💭 기타</option>
            </select>
          </div>

          {/* 제목 입력 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              📝 제목
            </label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg"
              placeholder="제목을 입력하세요"
              maxLength="100"
            />
            <div className="text-sm text-gray-500 mt-1">
              {newPost.title.length}/100자
            </div>
          </div>

          {/* 내용 입력 */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              📄 내용
            </label>
            <textarea
              value={newPost.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg resize-none"
              rows="10"
              placeholder="내용을 입력하세요&#10;&#10;• 개인정보는 절대 입력하지 마세요&#10;• 서로를 존중하는 댓글 문화를 만들어가요&#10;• 광고성 글은 삭제될 수 있습니다"
              maxLength="2000"
            />
            <div className="text-sm text-gray-500 mt-1">
              {newPost.content.length}/2000자
            </div>
          </div>

          {/* 작성 안내 */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-bold text-blue-800 mb-2">💡 익명 게시 안내</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 모든 게시글은 완전 익명으로 처리됩니다</li>
              <li>• 자산 구간과 지역만 뱃지로 표시됩니다</li>
              <li>• 개인을 특정할 수 있는 정보는 입력하지 마세요</li>
              <li>• 건전한 커뮤니티 문화를 위해 예의를 지켜주세요</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              onClick={() => setNewPost({ title: '', content: '', category: '노후생활' })}
            >
              초기화
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              📝 게시글 작성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};