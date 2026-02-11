'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (!user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 transition-all duration-300" id="main-content">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
