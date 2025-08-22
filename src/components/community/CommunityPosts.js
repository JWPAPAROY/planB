// 커뮤니티 게시글 컴포넌트 (기존 UI/UX 완전 보존, UI 컴포넌트 적용)
import React, { useState } from 'react';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';

export const CommunityPosts = ({ samplePosts }) => {
  const [selectedPost, setSelectedPost] = useState(null);

  const closePostDetail = () => {
    setSelectedPost(null);
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={closePostDetail}
            className="mb-6 text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← 목록으로 돌아가기
          </button>
          
          <Card>
            <div className="flex gap-2 mb-4">
              <Badge variant="anonymous">익명</Badge>
              <Badge variant="asset">{selectedPost.assetBadge}</Badge>
              <Badge variant="region">{selectedPost.regionBadge}</Badge>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedPost.title}</h2>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{selectedPost.content}</p>
            
            <div className="text-sm text-gray-500 mb-6">
              {selectedPost.date} · 조회 {selectedPost.views}
            </div>
            
            {/* 댓글 섹션 */}
            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-800 mb-4">댓글 {selectedPost.replies?.length || 0}개</h3>
              
              {selectedPost.replies?.map((reply, index) => (
                <div key={index} className="reply">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="anonymous">익명</Badge>
                    <Badge variant="asset">{reply.assetBadge}</Badge>
                  </div>
                  <p className="text-gray-700">{reply.content}</p>
                  <div className="text-xs text-gray-500 mt-2">{reply.date}</div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                  rows="3"
                  placeholder="댓글을 입력하세요..."
                />
                <div className="flex justify-end mt-3">
                  <Button>댓글 작성</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">💬 익명 커뮤니티</h1>
          <p className="text-xl text-gray-600">나와 비슷한 또래의 고민과 경험을 나누어보세요</p>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {samplePosts.map((post, index) => (
            <Card
              key={index}
              hover={true}
              onClick={() => setSelectedPost(post)}
              className="border-l-4 border-green-500 bg-green-50 hover:bg-green-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <Badge variant="anonymous">익명</Badge>
                  <Badge variant="asset">{post.assetBadge}</Badge>
                  <Badge variant="region">{post.regionBadge}</Badge>
                </div>
                <span className="text-xs text-gray-500">{post.date}</span>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-3">{post.preview}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>💬 {post.replies?.length || 0}개 댓글</span>
                <span>👀 조회 {post.views}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};