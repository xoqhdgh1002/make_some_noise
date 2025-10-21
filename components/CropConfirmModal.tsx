'use client';

import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

interface CropConfirmModalProps {
  croppedImage: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CropConfirmModal({ croppedImage, onConfirm, onCancel }: CropConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <h2 className="text-xl font-bold">선택한 영역 확인</h2>
          <p className="text-sm mt-1 opacity-90">
            텍스트가 모두 포함되었는지 확인해주세요
          </p>
        </div>

        {/* 이미지 미리보기 */}
        <div className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-inner p-4 max-h-96 overflow-auto">
            <img
              src={croppedImage}
              alt="크롭된 영역"
              className="mx-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>확인사항:</strong> 텍스트가 잘려있거나 필요한 부분이 누락되었다면 "다시 선택"을 눌러주세요.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-4 bg-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
          >
            <RotateCcw size={18} />
            다시 선택
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
          >
            <Check size={18} />
            확인하고 설명 받기
          </button>
        </div>
      </div>
    </div>
  );
}
