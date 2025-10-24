export type EmotionType = 'idle' | 'talking' | 'thinking' | 'angry' | 'celebrating' | 'crazy_dance' | 'confused';

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'cz';
  timestamp: string;
  username?: string;
  emotion?: EmotionType;
  audioBase64?: string;
}
