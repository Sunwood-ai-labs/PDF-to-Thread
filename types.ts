export interface SlideData {
  id: string;
  imageData: string; // Base64 data URL
  pageNumber: number;
}

export interface ThreadContent {
  slideIndex: number;
  threadPost: string;
  imageDescription: string;
}

export interface GeneratedThread {
  items: ThreadContent[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_PDF = 'PROCESSING_PDF',
  READY_TO_GENERATE = 'READY_TO_GENERATE',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}