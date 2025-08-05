
"use client";

import { AlertTriangle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner({ onSwitchBack, studentName }: { onSwitchBack: () => void; studentName: string }) {
    return (
        <div className="bg-yellow-500 text-yellow-900 p-2 text-center text-sm font-semibold sticky top-0 z-50 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>
                    You are viewing the dashboard as <strong>{studentName}</strong>.
                </span>
            </div>
            <Button
                onClick={onSwitchBack}
                variant="outline"
                size="sm"
                className="h-7 bg-yellow-100/50 hover:bg-yellow-100/80 text-yellow-900 border-yellow-700/50"
            >
                 <UserCheck className="h-4 w-4 mr-2" />
                Return to Admin View
            </Button>
        </div>
    );
}
