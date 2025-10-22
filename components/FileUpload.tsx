'use client';

import React, { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Upload, Image as ImageIcon, Globe, Loader2 } from 'lucide-react';

export default function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { setPdfDocument } = useAppStore();
  const [activeTab, setActiveTab] = useState<'file' | 'image' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      alert('올바른 URL을 입력해주세요. (예: https://example.com)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('웹페이지 캡처 요청:', url);

      // 서버에 웹페이지 스크린샷 요청
      const response = await fetch('/api/webpage-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        // 서버에서 반환한 구체적인 오류 메시지 파싱
        const errorData = await response.json();
        console.error('서버 오류:', errorData);

        let errorMsg = errorData.error || '웹페이지 변환 실패';
        if (errorData.suggestion) {
          errorMsg += '\n\n💡 ' + errorData.suggestion;
        }
        if (errorData.details) {
          console.error('상세 오류:', errorData.details);
        }

        alert(errorMsg);
        return;
      }

      const blob = await response.blob();

      // PDF가 제대로 생성되었는지 확인
      if (blob.size === 0) {
        throw new Error('빈 PDF가 생성되었습니다.');
      }

      console.log('PDF 생성 성공, 크기:', blob.size, 'bytes');

      const file = new File([blob], 'webpage.pdf', { type: 'application/pdf' });
      setPdfDocument({ file, numPages: 0, currentPage: 1 });
      setUrl(''); // 입력 필드 초기화
    } catch (error) {
      console.error('웹페이지 로드 오류:', error);

      let errorMsg = '웹페이지를 불러오는 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMsg += '\n\n상세: ' + error.message;
      }
      errorMsg += '\n\n💡 URL을 확인하거나 잠시 후 다시 시도해주세요.';

      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      {/* 탭 헤더 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
            activeTab === 'file'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload size={16} className="inline mr-1" />
          PDF
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
            activeTab === 'image'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ImageIcon size={16} className="inline mr-1" />
          이미지
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
            activeTab === 'url'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Globe size={16} className="inline mr-1" />
          URL
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
      ) : activeTab === 'image' ? (
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
            💡 웹페이지 스크린샷을 업로드하세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleUrlSubmit()}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                웹페이지 캡처 중...
              </>
            ) : (
              <>
                <Globe size={20} />
                웹페이지 불러오기
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">
            💡 URL만 입력하면 자동으로 캡처됩니다!
          </p>
        </div>
      )}
    </div>
  );
}
