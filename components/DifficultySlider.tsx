'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { DifficultyLevel } from '@/lib/types';

export default function DifficultySlider() {
  const { difficulty, setDifficulty } = useAppStore();

  const difficultyLevels: { value: DifficultyLevel; label: string; emoji: string; description: string }[] = [
    { value: 'easy', label: '순한맛', emoji: '😊', description: '초등학생도 이해!' },
    { value: 'medium', label: '중간맛', emoji: '🤔', description: '일상 예시' },
    { value: 'hard', label: '매운맛', emoji: '🔥', description: '전문 용어 풀이' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">난이도 조절 🎚️</h3>
      </div>

      <div className="relative">
        {/* 슬라이더 트랙 */}
        <div className="flex justify-between items-center gap-4">
          {difficultyLevels.map((level, index) => (
            <button
              key={level.value}
              onClick={() => setDifficulty(level.value)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                difficulty === level.value
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{level.emoji}</div>
              <div className="font-bold text-sm mb-1">{level.label}</div>
              <div className="text-xs text-gray-600">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 현재 선택된 난이도 표시 */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          현재 설명 난이도: <span className="font-bold text-blue-600">{difficultyLevels.find(l => l.value === difficulty)?.label}</span>
        </p>
      </div>
    </div>
  );
}
