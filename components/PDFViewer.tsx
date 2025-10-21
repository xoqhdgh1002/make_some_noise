'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAppStore } from '@/lib/store';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  onTextSelect?: (text: string, position: { x: number; y: number }) => void;
}

export default function PDFViewer({ onTextSelect }: PDFViewerProps) {
  const { pdfDocument, setPdfDocument } = useAppStore();
  const [pageWidth, setPageWidth] = useState(800);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setPdfDocument({ numPages, currentPage: 1 });
  };

  const changePage = (offset: number) => {
    const newPage = pdfDocument.currentPage + offset;
    if (newPage >= 1 && newPage <= pdfDocument.numPages) {
      setPdfDocument({ currentPage: newPage });
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-gray-50 overflow-auto">
      {pdfDocument.file && (
        <div className="relative">
          <Document
            file={pdfDocument.file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="pdf-document"
          >
            <Page
              pageNumber={pdfDocument.currentPage}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {/* 페이지 네비게이션 */}
          {pdfDocument.numPages > 0 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center gap-4">
              <button
                onClick={() => changePage(-1)}
                disabled={pdfDocument.currentPage <= 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                이전
              </button>
              <span className="text-sm font-medium">
                {pdfDocument.currentPage} / {pdfDocument.numPages}
              </span>
              <button
                onClick={() => changePage(1)}
                disabled={pdfDocument.currentPage >= pdfDocument.numPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
