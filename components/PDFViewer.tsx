'use client';

import React, { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { useAppStore } from '@/lib/store';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PDFViewer() {
  const { pdfDocument, setPdfDocument, translatedAreas } = useAppStore();
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // PDF.js worker 설정 (클라이언트 사이드에서만 실행)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  // PDF 로드
  useEffect(() => {
    if (!pdfDocument.file) return;

    const loadPDF = async () => {
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const loadingTask = pdfjs.getDocument(typedArray);
        const pdf = await loadingTask.promise;

        setPdfInstance(pdf);
        setPdfDocument({ numPages: pdf.numPages, currentPage: 1 });
      };

      fileReader.readAsArrayBuffer(pdfDocument.file);
    };

    loadPDF();
  }, [pdfDocument.file]);

  // 페이지 렌더링
  useEffect(() => {
    if (!pdfInstance || !canvasRef.current) return;

    // 이전 렌더링 작업이 있으면 취소
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const renderPage = async () => {
      try {
        const page = await pdfInstance.getPage(pdfDocument.currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;
      } catch (error: any) {
        if (error?.name === 'RenderingCancelledException') {
          // 렌더링이 취소된 경우 무시
          return;
        }
        console.error('페이지 렌더링 오류:', error);
      }
    };

    renderPage();

    // cleanup: 컴포넌트 언마운트 시 렌더링 취소
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfInstance, pdfDocument.currentPage]);

  const changePage = (offset: number) => {
    const newPage = pdfDocument.currentPage + offset;
    if (newPage >= 1 && newPage <= pdfDocument.numPages) {
      setPdfDocument({ currentPage: newPage });
    }
  };

  // 현재 페이지의 번역된 영역들 필터링
  const currentPageTranslations = translatedAreas.filter(
    (area) => area.cropArea.pageNumber === pdfDocument.currentPage && area.isVisible
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full h-full bg-gray-50 overflow-auto relative"
    >
      {pdfDocument.file && (
        <div className="relative">
          <canvas ref={canvasRef} className="shadow-lg" />

          {/* 번역된 텍스트 오버레이 */}
          {currentPageTranslations.map((area) => (
            <div
              key={area.id}
              className="absolute bg-yellow-100 bg-opacity-95 border-2 border-yellow-400 p-2 rounded shadow-lg"
              style={{
                left: `${area.cropArea.x}px`,
                top: `${area.cropArea.y}px`,
                width: `${area.cropArea.width}px`,
                minHeight: `${area.cropArea.height}px`,
              }}
            >
              <p className="text-sm leading-relaxed text-gray-800">
                {area.translatedText}
              </p>
            </div>
          ))}

          {/* 페이지 네비게이션 */}
          {pdfDocument.numPages > 0 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center gap-4 z-50">
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
