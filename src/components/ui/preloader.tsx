
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Preloader({ className, message = "Loading..." }: { className?: string, message?: string }) {
  return (
    <div className={cn("flex h-screen w-screen flex-col items-center justify-center bg-background", className)}>
      <div className="flex items-center gap-4 text-primary">
          <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={64} height={64} className="w-16 h-16 animate-pulse" />
      </div>
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}
