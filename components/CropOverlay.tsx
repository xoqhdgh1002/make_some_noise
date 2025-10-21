'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CropArea } from '@/lib/types';

interface CropOverlayProps {
  onCropComplete: (cropArea: CropArea, selectedText: string) => void;
}

export default function CropOverlay({ onCropComplete }: CropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const { pdfDocument, setIsSelecting } = useAppStore();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDragging(true);
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPos({ x, y });
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);
    setIsSelecting(false);

    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // 최소 크기 체크 (너무 작은 선택은 무시)
    if (width < 10 || height < 10) {
      return;
    }

    const cropArea: CropArea = {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width,
      height,
      pageNumber: pdfDocument.currentPage,
    };

    // 선택된 텍스트 추출 (실제로는 PDF에서 텍스트를 추출해야 하지만, 여기서는 시뮬레이션)
    const selectedText = await extractTextFromCrop(cropArea);

    onCropComplete(cropArea, selectedText);

    // 선택 영역 초기화
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });
  };

  const extractTextFromCrop = async (cropArea: CropArea): Promise<string> => {
    // 실제 구현에서는 PDF.js의 getTextContent를 사용하여 텍스트 추출
    // 여기서는 데모용으로 더미 텍스트 반환
    return `선택된 영역의 텍스트 (페이지 ${cropArea.pageNumber})`;
  };

  const getCropStyle = () => {
    if (!isDragging) return {};

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair z-10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false);
          setIsSelecting(false);
        }
      }}
    >
      {/* 크롭 선택 영역 */}
      {isDragging && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30"
          style={getCropStyle()}
        >
          <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            드래그하여 선택하세요
          </div>
        </div>
      )}
    </div>
  );
}
