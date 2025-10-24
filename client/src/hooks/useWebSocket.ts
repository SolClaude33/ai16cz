import { useState, useRef, useEffect, useCallback } from "react";
import type { EmotionType } from '@shared/schema';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'cz';
  timestamp: string;
  emotion?: EmotionType;
  audioBase64?: string;
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(true); // Always connected for HTTP API
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('idle');
  const [viewerCount, setViewerCount] = useState(1); // Simulate viewer count

  const sendMessage = useCallback(async (type: string, data: any) => {
    if (type === 'user_message') {
      try {
        // Send user message immediately
        const userMessage = {
          id: Date.now().toString(),
          message: data.content,
          sender: 'user' as const,
          username: data.username || 'Anonymous',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        setLastMessage({
          type: 'user_message',
          data: userMessage
        });

        // Set thinking emotion
        setCurrentEmotion('thinking');
        setLastMessage({
          type: 'cz_emotion',
          data: { emotion: 'thinking' }
        });

        // Call API for AI response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: data.content }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          
          // Set final emotion
          setCurrentEmotion(aiResponse.emotion);
          setLastMessage({
            type: 'cz_emotion',
            data: { emotion: aiResponse.emotion }
          });

          // Send CZ message after delay
          setTimeout(() => {
            const czMessage = {
              id: (Date.now() + 1).toString(),
              message: aiResponse.message,
              sender: 'cz' as const,
              timestamp: aiResponse.timestamp,
              emotion: aiResponse.emotion,
              audioBase64: aiResponse.audioBase64
            };
            
            setLastMessage({
              type: 'cz_message',
              data: czMessage
            });
          }, 500);
        } else {
          throw new Error('API call failed');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setCurrentEmotion('talking');
        setLastMessage({
          type: 'cz_message',
          data: {
            id: (Date.now() + 1).toString(),
            message: "哎呀！处理时出现了一个小错误。你能再试一次吗？",
            sender: 'cz',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            emotion: 'talking'
          }
        });
      }
    }
  }, []);

  const sendEmotion = useCallback((emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  }, []);

  // Listen for audio ended event to return to idle
  useEffect(() => {
    const handleAudioEnded = () => {
      setCurrentEmotion('idle');
    };
    
    window.addEventListener('czAudioEnded', handleAudioEnded);
    return () => {
      window.removeEventListener('czAudioEnded', handleAudioEnded);
    };
  }, []);

  return { isConnected, lastMessage, sendMessage, currentEmotion, sendEmotion };
}