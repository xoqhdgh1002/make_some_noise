'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

export default function TranslationManager() {
  const { translatedAreas, toggleTranslatedArea, removeTranslatedArea } = useAppStore();

  if (translatedAreas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-bold text-lg mb-4">🎨 번역된 영역 ({translatedAreas.length})</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {translatedAreas.map((area) => (
          <div
            key={area.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                페이지 {area.cropArea.pageNumber}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {area.originalText.substring(0, 30)}...
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => toggleTranslatedArea(area.id)}
                className={`p-2 rounded ${
                  area.isVisible
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                }`}
                title={area.isVisible ? '숨기기' : '보이기'}
              >
                {area.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={() => removeTranslatedArea(area.id)}
                className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                title="삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
