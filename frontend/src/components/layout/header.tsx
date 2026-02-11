'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useApi } from '@/hooks/use-api';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: unreadCount } = useApi<number>('/notifications/unread-count');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Welcome back, {user?.firstName}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {showNotifications && (
          <div className="absolute right-6 top-14 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              <Link href="/notifications" className="text-xs text-accent hover:underline" onClick={() => setShowNotifications(false)}>
                View all
              </Link>
            </div>
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No new notifications
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
