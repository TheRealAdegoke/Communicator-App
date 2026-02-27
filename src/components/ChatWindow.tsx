import { useEffect, useRef } from "react";
import type { MessageDto } from "../lib/api";
import { cn } from "../lib/utils";

interface Props {
  messages: MessageDto[];
  currentUserId: string;
  partnerUsername: string;
}

export default function ChatWindow({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3.5 bg-transparent">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((msg) => {
          const isSent = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-1.5 max-w-[80%]",
                isSent ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm relative",
                  isSent
                    ? "rounded-br-none bg-[#d9fdd3] dark:bg-[#005e54] dark:text-white"
                    : "rounded-bl-none bg-white dark:bg-[#202c33] dark:text-white"
                )}
              >
                <p className="wrap-break-word whitespace-pre-wrap">
                  {msg.content}
                </p>

                <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] opacity-70">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
