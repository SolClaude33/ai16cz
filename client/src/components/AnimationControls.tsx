import { Button } from "@/components/ui/button";
import { Smile, Brain, PartyPopper, Frown, CircleDot, Music, HelpCircle } from "lucide-react";
import type { EmotionType } from '../types/schema';

interface AnimationControlsProps {
  onEmotionChange: (emotion: EmotionType) => void;
  currentEmotion: EmotionType;
}

export default function AnimationControls({ onEmotionChange, currentEmotion }: AnimationControlsProps) {
  const emotions: { type: EmotionType; label: string; icon: React.ReactNode; activeColor: string }[] = [
    { type: 'idle', label: '待机', icon: <CircleDot className="h-4 w-4" />, activeColor: 'bg-gray-500' },
    { type: 'talking', label: '说话', icon: <Smile className="h-4 w-4" />, activeColor: 'bg-blue-500' },
    { type: 'thinking', label: '思考', icon: <Brain className="h-4 w-4" />, activeColor: 'bg-purple-500' },
    { type: 'celebrating', label: '开心', icon: <PartyPopper className="h-4 w-4" />, activeColor: 'bg-green-500' },
    { type: 'angry', label: '生气', icon: <Frown className="h-4 w-4" />, activeColor: 'bg-red-500' },
    { type: 'crazy_dance', label: '跳舞', icon: <Music className="h-4 w-4" />, activeColor: 'bg-pink-500' },
    { type: 'confused', label: '困惑', icon: <HelpCircle className="h-4 w-4" />, activeColor: 'bg-orange-500' },
  ];

  return (
    <div className="bg-card backdrop-blur-sm border-2 border-border rounded-2xl p-4 shadow-md">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
        动画控制
      </h3>
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => (
          <Button
            key={emotion.type}
            variant="outline"
            size="sm"
            className={`gap-1.5 border-2 rounded-xl px-3 py-2 font-bold transition-all text-xs ${
              currentEmotion === emotion.type
                ? `${emotion.activeColor} border-transparent text-white shadow-lg scale-105`
                : `bg-card border-border text-foreground hover:bg-muted`
            }`}
            onClick={() => onEmotionChange(emotion.type)}
            data-testid={`button-animation-${emotion.type}`}
          >
            <span className={currentEmotion === emotion.type ? 'text-white' : ''}>{emotion.icon}</span>
            <span>{emotion.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
