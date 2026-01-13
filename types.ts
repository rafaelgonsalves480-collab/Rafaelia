export interface ImageAttachment {
  mimeType: string;
  data: string; // Base64 string
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  images?: ImageAttachment[];
  timestamp: number;
  isError?: boolean;
}

export enum GeminiModel {
  // Switched to Flash for extreme speed (< 2s latency goal)
  PRO = 'gemini-3-flash-preview',
}

export interface GenerationConfig {
  temperature: number;
  maxOutputTokens?: number;
}