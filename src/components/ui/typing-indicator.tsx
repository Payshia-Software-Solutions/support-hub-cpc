import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 p-2", className)}>
      <div className="h-2 w-2 animate-typing-dot-bounce rounded-full bg-muted-foreground/80" />
      <div
        className="h-2 w-2 animate-typing-dot-bounce rounded-full bg-muted-foreground/80"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="h-2 w-2 animate-typing-dot-bounce rounded-full bg-muted-foreground/80"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}
