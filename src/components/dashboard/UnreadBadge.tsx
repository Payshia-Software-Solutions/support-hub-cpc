
"use client";

import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '@/lib/actions/tickets';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface UnreadBadgeProps {
  ticketId: string;
  userRole: 'student' | 'staff';
}

export function UnreadBadge({ ticketId, userRole }: UnreadBadgeProps) {
  const fromRole = userRole === 'student' ? 'staff' : 'student';

  const { data: count, isLoading } = useQuery<number>({
    queryKey: ['unreadCount', ticketId, userRole],
    queryFn: () => getUnreadMessageCount(ticketId, fromRole),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });

  if (isLoading) {
    return <Skeleton className="h-5 w-8 rounded-full" />;
  }

  if (!count || count === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
        {count} New
    </Badge>
  )
}
