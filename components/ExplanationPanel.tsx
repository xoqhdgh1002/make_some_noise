'use client';

import React from 'react';
import { Explanation } from '@/lib/types';
import { X, Lightbulb, Image as ImageIcon } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: Explanation | null;
  onClose: () => void;
}

export default function ExplanationPanel({ explanation, onClose }: ExplanationPanelProps) {
  if (!explanation) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-slide-in">
      {/* 헤더 */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">마법 크롭 설명 ✨</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 내용 */}
      <div className="p-6 space-y-6">
        {/* 원본 텍스트 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">선택한 내용</h3>
          <p className="text-sm text-gray-600 italic">{explanation.croppedText}</p>
        </div>

        {/* AI 설명 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Lightbulb size={16} />
            쉬운 설명
          </h3>
          <p className="text-gray-800 leading-relaxed">{explanation.explanation}</p>
        </div>

        {/* 찰떡 비유 */}
        {explanation.analogy && (
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <h3 className="text-sm font-bold text-green-800 mb-3">💡 찰떡 비유</h3>
            <p className="text-gray-800 leading-relaxed">{explanation.analogy}</p>
          </div>
        )}

        {/* 시각화 */}
        {explanation.visualization && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
              <ImageIcon size={16} />
              시각화
            </h3>
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm">{explanation.visualization}</p>
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>페이지: {explanation.cropArea.pageNumber}</p>
          <p>난이도: {explanation.difficulty === 'easy' ? '순한맛' : explanation.difficulty === 'medium' ? '중간맛' : '매운맛'}</p>
        </div>
      </div>
    </div>
  );
}
