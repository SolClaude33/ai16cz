import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import czAvatar from "@assets/image_1761243437671.png";

interface ChatMessageProps {
  id: string;
  message: string;
  sender: "user" | "cz";
  timestamp: string;
  username?: string;
}

export default function ChatMessage({ message, sender, timestamp, username }: ChatMessageProps) {
  const isCZ = sender === "cz";

  return (
    <div 
      className={`flex gap-3 ${isCZ ? '' : 'flex-row-reverse'} animate-in slide-in-from-bottom-3 fade-in duration-300`}
      data-testid={`message-${sender}`}
    >
      <Avatar className={`h-11 w-11 flex-shrink-0 ${isCZ ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-sm' : 'ring-2 ring-secondary/30 ring-offset-2 ring-offset-background shadow-sm'}`}>
        {isCZ ? (
          <>
            <AvatarImage src={czAvatar} alt="CZ" className="object-cover" />
            <AvatarFallback className="bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-secondary">
            <User className="h-5 w-5 text-white" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isCZ ? 'items-start' : 'items-end'}`}>
        <div className="flex items-center gap-2 px-1">
          <span className={`text-sm font-bold ${isCZ ? 'text-foreground' : 'text-foreground'}`}>
            {isCZ ? 'CZ AI' : username || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground font-medium">{timestamp}</span>
        </div>
        
        <div 
          className={`rounded-2xl px-4 py-3 shadow-sm border ${
            isCZ 
              ? 'bg-muted border-border text-foreground' 
              : 'bg-secondary border-secondary text-white'
          }`}
        >
          <p className="text-sm font-medium leading-relaxed break-words">{message}</p>
        </div>
      </div>
    </div>
  );
}
