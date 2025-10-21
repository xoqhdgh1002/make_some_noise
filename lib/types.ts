// 마법 크롭 타입 정의

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface Explanation {
  id: string;
  cropArea: CropArea;
  croppedText: string;
  difficulty: DifficultyLevel;
  explanation: string;
  analogy?: string;
  visualization?: string;
  timestamp: number;
}

export interface PDFDocument {
  file: File | null;
  numPages: number;
  currentPage: number;
}

export interface TranslatedArea {
  id: string;
  cropArea: CropArea;
  originalText: string;
  translatedText: string;
  isVisible: boolean;
}
