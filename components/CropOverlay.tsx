'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CropArea } from '@/lib/types';
import CropConfirmModal from './CropConfirmModal';

interface CropOverlayProps {
  onCropComplete: (
    cropArea: CropArea,
    croppedImage: string,
    contextImage: string,
    backgroundColor: string,
    textColor: string
  ) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function CropOverlay({ onCropComplete, canvasRef }: CropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // 확인 모달 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<{
    cropArea: CropArea;
    croppedImage: string;
    contextImage: string;
    backgroundColor: string;
    textColor: string;
  } | null>(null);

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

    // 크롭 영역의 이미지 추출
    const result = await extractImageFromCrop(cropArea);

    if (result) {
      // 확인 모달 표시
      setPendingCrop({
        cropArea,
        croppedImage: result.croppedImage,
        contextImage: result.contextImage,
        backgroundColor: result.backgroundColor,
        textColor: result.textColor,
      });
      setShowConfirmModal(true);
    }

    // 선택 영역 초기화
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });
  };

  // 확인 모달에서 "확인" 클릭 시
  const handleConfirm = () => {
    if (pendingCrop) {
      onCropComplete(
        pendingCrop.cropArea,
        pendingCrop.croppedImage,
        pendingCrop.contextImage,
        pendingCrop.backgroundColor,
        pendingCrop.textColor
      );
    }
    setShowConfirmModal(false);
    setPendingCrop(null);
  };

  // 확인 모달에서 "다시 선택" 클릭 시
  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingCrop(null);
  };

  const extractImageFromCrop = async (cropArea: CropArea): Promise<{
    croppedImage: string;
    contextImage: string;
    backgroundColor: string;
    textColor: string;
  } | null> => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;

    // 1. 크롭 영역만 추출
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return null;

    croppedCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // 2. 컨텍스트 영역 (앞뒤 포함) 추출
    // 위아래로 크롭 영역의 2배 크기만큼 확장
    const contextPadding = cropArea.height * 2;
    const contextX = cropArea.x;
    const contextY = Math.max(0, cropArea.y - contextPadding);
    const contextWidth = cropArea.width;
    const contextHeight = Math.min(
      canvas.height - contextY,
      cropArea.height + contextPadding * 2
    );

    const contextCanvas = document.createElement('canvas');
    contextCanvas.width = contextWidth;
    contextCanvas.height = contextHeight;

    const contextCtx = contextCanvas.getContext('2d');
    if (!contextCtx) return null;

    contextCtx.drawImage(
      canvas,
      contextX, contextY, contextWidth, contextHeight,
      0, 0, contextWidth, contextHeight
    );

    // 3. 배경색 추출 (크롭 영역의 평균 색상)
    const imageData = croppedCtx.getImageData(0, 0, cropArea.width, cropArea.height);
    const { backgroundColor, textColor } = extractColors(imageData);

    return {
      croppedImage: croppedCanvas.toDataURL('image/png'),
      contextImage: contextCanvas.toDataURL('image/png'),
      backgroundColor,
      textColor,
    };
  };

  const extractColors = (imageData: ImageData): { backgroundColor: string; textColor: string } => {
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    let pixelCount = 0;

    // 샘플링 (성능을 위해 10픽셀마다 1개씩)
    for (let i = 0; i < data.length; i += 40) { // RGBA이므로 4씩 건너뛰기 * 10
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      pixelCount++;
    }

    // 평균 색상 계산
    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    // 밝기 계산 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 텍스트 색상 결정 (배경이 밝으면 검정, 어두우면 흰색)
    const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      textColor,
    };
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
    <>
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

      {/* 확인 모달 */}
      {showConfirmModal && pendingCrop && (
        <CropConfirmModal
          croppedImage={pendingCrop.croppedImage}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
