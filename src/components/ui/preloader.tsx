
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Preloader({ className, message = "Loading..." }: { className?: string, message?: string }) {
  return (
    <div className={cn("flex h-screen w-screen flex-col items-center justify-center bg-background", className)}>
      <div className="relative flex items-center justify-center h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
          <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={64} height={64} className="w-16 h-16" />
      </div>
      <p className="mt-6 text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
