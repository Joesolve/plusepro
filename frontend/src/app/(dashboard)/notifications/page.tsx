'use client';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { timeAgo, cn } from '@/lib/utils';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  SURVEY_ASSIGNED: 'bg-blue-100 text-blue-600',
  SURVEY_REMINDER: 'bg-yellow-100 text-yellow-600',
  SUGGESTION_UPDATE: 'bg-purple-100 text-purple-600',
  RECOGNITION_RECEIVED: 'bg-green-100 text-green-600',
  ASSESSMENT_DUE: 'bg-orange-100 text-orange-600',
  SYSTEM: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const { data: notifications, isLoading, refetch } = useApi<Notification[]>('/notifications?limit=50');
  const { mutate: markAllRead } = useMutation('patch', '/notifications/read-all');
  const { mutate: markRead } = useMutation('patch', '/notifications');

  const handleMarkAllRead = async () => {
    await markAllRead({});
    refetch();
  };

  const handleMarkRead = async (id: string) => {
    await markRead({}, `/notifications/${id}/read`);
    refetch();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay up to date with your activity</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all as read</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}</div>
      ) : notifications?.length ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn('cursor-pointer hover:bg-gray-50 transition-colors', !n.isRead && 'border-l-4 border-l-accent bg-accent/5')}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm', n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium')}>{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-center py-12 text-gray-400 text-sm">No notifications</div></Card>
      )}
    </div>
  );
}
