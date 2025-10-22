'use client';

import React, { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { setPdfDocument } = useAppStore();
  const [activeTab, setActiveTab] = useState<'file' | 'image'>('file');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfDocument({ file, numPages: 0, currentPage: 1 });
    } else {
      alert('PDF 파일만 업로드할 수 있습니다.');
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      // 이미지를 PDF로 변환
      const pdfBlob = await convertImageToPdf(file);
      const pdfFile = new File([pdfBlob], 'image.pdf', { type: 'application/pdf' });
      setPdfDocument({ file: pdfFile, numPages: 0, currentPage: 1 });
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      alert('이미지를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const convertImageToPdf = async (imageFile: File): Promise<Blob> => {
    const jsPDF = (await import('jspdf')).default;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // 이미지 크기에 맞는 PDF 생성
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [img.width, img.height],
            });

            // 이미지를 PDF에 추가
            pdf.addImage(img, 'PNG', 0, 0, img.width, img.height);

            // PDF를 Blob으로 변환
            const pdfBlob = pdf.output('blob');
            resolve(pdfBlob);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      {/* 탭 헤더 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'file'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload size={18} className="inline mr-2" />
          PDF 파일
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'image'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ImageIcon size={18} className="inline mr-2" />
          이미지
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleFileClick}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 font-bold"
          >
            <Upload size={20} />
            PDF 파일 업로드하기
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            onClick={handleImageClick}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 font-bold"
          >
            <ImageIcon size={20} />
            이미지 파일 업로드하기
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            💡 웹페이지 스크린샷을 찍어 업로드하면 크롭할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
