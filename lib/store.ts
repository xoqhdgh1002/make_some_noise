// Zustand 상태 관리 스토어

import { create } from 'zustand';
import { DifficultyLevel, CropArea, Explanation, PDFDocument, TranslatedArea } from './types';

interface AppState {
  // PDF 관련 상태
  pdfDocument: PDFDocument;
  setPdfDocument: (doc: Partial<PDFDocument>) => void;

  // 크롭 관련 상태
  isSelecting: boolean;
  setIsSelecting: (selecting: boolean) => void;
  currentCropArea: CropArea | null;
  setCurrentCropArea: (area: CropArea | null) => void;

  // 난이도 설정
  difficulty: DifficultyLevel;
  setDifficulty: (level: DifficultyLevel) => void;

  // 설명 히스토리
  explanations: Explanation[];
  addExplanation: (explanation: Explanation) => void;

  // 로딩 상태
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 현재 선택된 설명
  selectedExplanation: Explanation | null;
  setSelectedExplanation: (explanation: Explanation | null) => void;

  // 번역된 영역들
  translatedAreas: TranslatedArea[];
  addTranslatedArea: (area: TranslatedArea) => void;
  toggleTranslatedArea: (id: string) => void;
  removeTranslatedArea: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  pdfDocument: {
    file: null,
    numPages: 0,
    currentPage: 1,
  },
  setPdfDocument: (doc) =>
    set((state) => ({
      pdfDocument: { ...state.pdfDocument, ...doc },
    })),

  isSelecting: false,
  setIsSelecting: (selecting) => set({ isSelecting: selecting }),

  currentCropArea: null,
  setCurrentCropArea: (area) => set({ currentCropArea: area }),

  difficulty: 'easy',
  setDifficulty: (level) => set({ difficulty: level }),

  explanations: [],
  addExplanation: (explanation) =>
    set((state) => ({
      explanations: [...state.explanations, explanation],
    })),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  selectedExplanation: null,
  setSelectedExplanation: (explanation) =>
    set({ selectedExplanation: explanation }),

  translatedAreas: [],
  addTranslatedArea: (area) =>
    set((state) => ({
      translatedAreas: [...state.translatedAreas, area],
    })),
  toggleTranslatedArea: (id) =>
    set((state) => ({
      translatedAreas: state.translatedAreas.map((area) =>
        area.id === id ? { ...area, isVisible: !area.isVisible } : area
      ),
    })),
  removeTranslatedArea: (id) =>
    set((state) => ({
      translatedAreas: state.translatedAreas.filter((area) => area.id !== id),
    })),
}));
