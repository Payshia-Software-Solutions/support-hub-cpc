
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Ticket, Star, Gift, Redo, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LuckyWheelIcon } from '@/components/icons/module-icons';

const segments = [
  { color: '#818CF8', label: '100 PTS', value: 100 },
  { color: '#F472B6', label: 'TRY AGAIN', value: 0 },
  { color: '#FBBF24', label: '200 PTS', value: 200 },
  { color: '#34D399', label: '50 PTS', value: 50 },
  { color: '#60A5FA', label: 'JACKPOT', value: 1000 },
  { color: '#A78BFA', label: '150 PTS', value: 150 },
  { color: '#FB923C', label: 'TRY AGAIN', value: 0 },
  { color: '#EC4899', label: '500 PTS', value: 500 },
];

const segmentAngle = 360 / segments.length;

export default function LuckyWheelPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof segments[number] | null>(null);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    const winningSegmentIndex = Math.floor(Math.random() * segments.length);
    const randomAngleWithinSegment = Math.random() * (segmentAngle - 10) + 5;
    const baseRotation = 360 * 5; // Spin at least 5 times
    const finalAngle = baseRotation - (winningSegmentIndex * segmentAngle + randomAngleWithinSegment);

    setRotation(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const winningSegment = segments[winningSegmentIndex];
      setResult(winningSegment);
      toast({
        title: 'Congratulations!',
        description: winningSegment.value > 0 ? `You won ${winningSegment.label}!` : 'Better luck next time!',
      });
    }, 5000); // Corresponds to the animation duration
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 flex flex-col items-center">
      <header className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <LuckyWheelIcon className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-headline font-semibold">Lucky Wheel</h1>
        <p className="text-muted-foreground">Spin the wheel to win points!</p>
      </header>

      <div className="relative w-full max-w-sm aspect-square">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}>
          <div className="w-0 h-0 border-x-8 border-x-transparent border-b-[16px] border-b-primary"></div>
        </div>
        
        {/* Wheel */}
        <div
          className="relative w-full h-full rounded-full border-8 border-primary shadow-2xl transition-transform duration-[5000ms] ease-[cubic-bezier(0.1,0.7,0.3,1)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {segments.map((segment, index) => (
            <div
              key={index}
              className="absolute w-1/2 h-1/2 origin-bottom-right"
              style={{
                transform: `rotate(${index * segmentAngle}deg)`,
                clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 0%)`,
              }}
            >
              <div
                className="w-full h-full flex items-center justify-start text-white text-xs font-bold"
                style={{
                  backgroundColor: segment.color,
                  transform: 'rotate(22.5deg) translateX(5%)', // Center the text
                }}
              >
                <span className="pl-4">{segment.label}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Center Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-card rounded-full border-4 border-primary/50 flex items-center justify-center text-primary font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          SPIN
        </button>
      </div>

       {result && !isSpinning && (
            <Card className="w-full max-w-sm mt-8 animate-in fade-in-50 zoom-in-95">
                <CardHeader className="text-center">
                    <CardTitle>You Won!</CardTitle>
                    <CardDescription>{result.label}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" onClick={handleSpin}>
                        <Redo className="mr-2 h-4 w-4" /> Spin Again
                    </Button>
                </CardFooter>
            </Card>
       )}
    </div>
  );
}
