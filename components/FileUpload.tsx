'use client';

import React, { useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Upload } from 'lucide-react';

export default function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPdfDocument } = useAppStore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfDocument({ file, numPages: 0, currentPage: 1 });
    } else {
      alert('PDF 파일만 업로드할 수 있습니다.');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 font-bold text-lg"
      >
        <Upload size={24} />
        PDF 파일 업로드하기
      </button>
    </div>
  );
}
