import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, TrendingUp, Wifi, WifiOff, Lock } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage as ChatMessageType } from '../types/schema';
import gigglesLogo from '@assets/image-removebg-preview (30)_1759978567238.png';

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "1",
      message: "欢迎来到 CZ AI 直播！我是 CZ，BNB Chain 上的智能AI助手，在这里帮助你学习加密货币和区块链！连接你的 BNB 钱包开始与我聊天！",
      sender: "cz",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const { address } = useWallet();
  const { toast } = useToast();
  
  const { isConnected, lastMessage, sendMessage } = useWebSocket('/ws');

  // Function to play next audio from queue
  const playNextAudio = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const audioBase64 = audioQueueRef.current.shift()!;
    isPlayingRef.current = true;

    try {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      currentAudioRef.current = audio;

      audio.addEventListener('ended', () => {
        window.dispatchEvent(new CustomEvent('czAudioEnded'));
        currentAudioRef.current = null;
        isPlayingRef.current = false;
        // Play next audio in queue
        playNextAudio();
      });

      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        window.dispatchEvent(new CustomEvent('czAudioEnded'));
        currentAudioRef.current = null;
        isPlayingRef.current = false;
        // Try next audio in queue even if this one failed
        playNextAudio();
      });
    } catch (error) {
      console.error('Error creating audio:', error);
      window.dispatchEvent(new CustomEvent('czAudioEnded'));
      isPlayingRef.current = false;
      // Try next audio in queue even if this one failed
      playNextAudio();
    }
  };

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'user_message') {
        setMessages(prev => [...prev, lastMessage.data]);
      } else if (lastMessage.type === 'cz_message') {
        setMessages(prev => [...prev, lastMessage.data]);
        
        // Clear any pending fallback timeout
        if (fallbackTimeoutRef.current !== null) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        
        // Add audio to queue if available
        if (lastMessage.data.audioBase64) {
          audioQueueRef.current.push(lastMessage.data.audioBase64);
          playNextAudio();
        } else {
          // No audio available (TTS failed or disabled), return to idle after short delay
          fallbackTimeoutRef.current = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('czAudioEnded'));
            fallbackTimeoutRef.current = null;
          }, 2000);
        }
      } else if (lastMessage.type === 'viewer_count') {
        setViewerCount(lastMessage.data.count);
      } else if (lastMessage.type === 'error') {
        toast({
          variant: "destructive",
          title: "速率限制",
          description: lastMessage.data.message,
        });
      }
    }
  }, [lastMessage, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup fallback timeout, audio, and queue on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current !== null) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || !isConnected || !address) return;

    sendMessage('user_message', {
      content: input,
      username: `${address.slice(0, 6)}...${address.slice(-4)}`
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-background border-l-2 border-border shadow-lg">
      <img 
        src={gigglesLogo} 
        alt="Giggles Academy" 
        className="absolute top-1/3 right-8 w-32 h-32 opacity-15 pointer-events-none animate-pulse z-0"
      />
      <img 
        src={gigglesLogo} 
        alt="Giggles Academy" 
        className="absolute bottom-1/4 left-8 w-28 h-28 opacity-12 pointer-events-none animate-pulse z-0"
      />
      
      <div className="border-b-2 border-border bg-background px-6 py-5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight font-[Space_Grotesk]">
              实时聊天
            </h2>
            {isConnected ? (
              <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full shadow-sm">
                <Wifi className="h-3.5 w-3.5 text-white" data-testid="status-connected" />
                <span className="text-xs font-bold text-white">在线</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full shadow-sm">
                <WifiOff className="h-3.5 w-3.5 text-white animate-pulse" data-testid="status-disconnected" />
                <span className="text-xs font-bold text-white">离线</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full" data-testid="viewer-count">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground tabular-nums">{viewerCount}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 relative z-10">
        <div ref={scrollRef} className="space-y-4 py-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t-2 border-border bg-background p-5 relative z-10">
        <div className="flex items-center gap-3">
          {!address && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
              <div className="text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">连接你的 BNB 钱包开始聊天</p>
              </div>
            </div>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!address ? "连接钱包开始聊天..." : isConnected ? "输入消息..." : "连接中..."}
            className="flex-1 bg-card border-2 border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary text-foreground placeholder:text-muted-foreground rounded-xl h-11 px-4 font-medium"
            data-testid="input-chat"
            disabled={!isConnected || !address}
          />
          <Button 
            onClick={handleSend}
            size="icon"
            disabled={!input.trim() || !isConnected || !address}
            data-testid="button-send"
            className="h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
