export type ViewportType = 'desktop' | 'mobile';

export interface Resolution {
  width: number;
  height: number;
  label: string;
}

export interface CaptureConfig {
  desktop: boolean;
  mobile: boolean;
  desktopRes: Resolution;
  mobileRes: Resolution;
  fullPage: boolean;
  autoDownload: boolean;
  depth: number; // 1 = Only URL, 2 = URL + 1st level links, etc.
  filenameTemplate: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  dataUrl: string; // Base64
  viewport: ViewportType;
  width: number;
  height: number;
  filename: string;
  analysis?: string; // Gemini analysis result
}

export interface ScreenshotTask {
  id: string;
  url: string;
  timestamp: Date;
  status: 'loading' | 'completed' | 'error';
  images: GeneratedImage[];
  config: CaptureConfig;
}