
"use client";

import { useEffect, useRef, useState } from 'react';

function useAnimatedCounter(endValue: number, duration: number = 1000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const end = endValue;
                    if (start === end) return;

                    const startTime = Date.now();

                    const step = () => {
                        const now = Date.now();
                        const progress = Math.min((now - startTime) / duration, 1);
                        const currentVal = Math.floor(progress * end);
                        
                        setCount(currentVal);

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                             setCount(end); // Ensure it ends exactly on the end value
                        }
                    };

                    requestAnimationFrame(step);
                    observer.disconnect(); // Animate only once
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [endValue, duration]);

    return { count, ref };
}

export const AnimatedCounter = ({ value, className }: { value: number, className?: string }) => {
    const { count, ref } = useAnimatedCounter(value);
    return <span ref={ref} className={className}>{count.toLocaleString()}</span>;
};
