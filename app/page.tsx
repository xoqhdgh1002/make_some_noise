'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import FileUpload from '@/components/FileUpload';
import PDFViewer from '@/components/PDFViewer';
import DifficultySlider from '@/components/DifficultySlider';
import ExplanationPanel from '@/components/ExplanationPanel';
import TranslationManager from '@/components/TranslationManager';
import { CropArea, Explanation, TranslatedArea } from '@/lib/types';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const {
    pdfDocument,
    difficulty,
    selectedExplanation,
    setSelectedExplanation,
    addExplanation,
    addTranslatedArea,
    isLoading,
    setIsLoading,
  } = useAppStore();

  const handleCropComplete = async (cropArea: CropArea, croppedImage: string) => {
    setIsLoading(true);

    try {
      // AI 설명 생성 API 호출 (이미지를 보내서 텍스트 추출 및 설명 생성)
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: croppedImage,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('설명 생성 실패');
      }

      const data = await response.json();

      const id = Date.now().toString();

      // 새로운 설명 객체 생성
      const newExplanation: Explanation = {
        id,
        cropArea,
        croppedText: selectedText,
        difficulty,
        explanation: data.explanation,
        analogy: data.analogy,
        visualization: data.visualization,
        timestamp: Date.now(),
      };

      // 번역된 영역 추가 (PDF 위에 오버레이될 내용)
      const translatedArea: TranslatedArea = {
        id,
        cropArea,
        originalText: data.extractedText || '추출된 텍스트',
        translatedText: data.explanation,
        isVisible: true,
      };

      // 설명 저장 및 패널 열기
      addExplanation(newExplanation);
      addTranslatedArea(translatedArea);
      setSelectedExplanation(newExplanation);
    } catch (error) {
      console.error('설명 생성 오류:', error);
      alert('설명을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-600" size={32} />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                마법 크롭 (Magic Crop)
              </h1>
            </div>
            <p className="text-sm text-gray-600 hidden md:block">
              AI가 어려운 전공 서적을 쉽게 설명해드립니다 ✨
            </p>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!pdfDocument.file ? (
          // PDF가 없을 때: 업로드 화면
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-gray-800">
                  전공 서적, 이제 쉽게 이해하세요!
                </h2>
                <p className="text-lg text-gray-600">
                  PDF 파일을 업로드하고, 모르는 부분을 드래그하면<br />
                  AI가 마법처럼 쉽게 설명해드립니다 🪄
                </p>
              </div>

              <FileUpload />

              {/* 기능 소개 */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="text-4xl mb-3">📖</div>
                  <h3 className="font-bold text-lg mb-2">PDF 읽기</h3>
                  <p className="text-sm text-gray-600">
                    전공 서적이나 논문을 편하게 읽어보세요
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="text-4xl mb-3">✂️</div>
                  <h3 className="font-bold text-lg mb-2">마법 크롭</h3>
                  <p className="text-sm text-gray-600">
                    모르는 부분을 드래그하면 AI가 즉시 설명
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="text-4xl mb-3">🎚️</div>
                  <h3 className="font-bold text-lg mb-2">난이도 조절</h3>
                  <p className="text-sm text-gray-600">
                    초등학생부터 전문가 수준까지 선택 가능
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // PDF가 있을 때: 뷰어 화면
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 컨트롤 패널 */}
            <div className="lg:col-span-1 space-y-4">
              <FileUpload />
              <DifficultySlider />
              <TranslationManager />

              {/* 사용 방법 안내 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">📝 사용 방법</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>난이도를 선택하세요</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>PDF에서 모르는 부분을 드래그하세요</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>쉬운 설명이 해당 영역에 표시됩니다!</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* 오른쪽: PDF 뷰어 */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 relative min-h-[600px]">
              <PDFViewer onCropComplete={handleCropComplete} />

              {/* 로딩 오버레이 */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
                  <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="font-bold text-gray-800">AI가 설명을 생성하고 있습니다...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 설명 패널 */}
      <ExplanationPanel
        explanation={selectedExplanation}
        onClose={() => setSelectedExplanation(null)}
      />

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>🎓 마법 크롭 - AI 기반 지식 접근 플랫폼</p>
          <p className="mt-2">전공 지식과 일상 언어 사이의 장벽을 허물다</p>
        </div>
      </footer>
    </div>
  );
}
