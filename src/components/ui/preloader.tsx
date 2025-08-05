
import { cn } from "@/lib/utils";

export function Preloader({ className, message = "Loading..." }: { className?: string, message?: string }) {
  return (
    <div className={cn("flex h-screen w-screen flex-col items-center justify-center bg-background", className)}>
      <div className="flex items-center gap-4 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-16 h-16 animate-pulse">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <path d="M12 17V15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 7V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
      </div>
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}
