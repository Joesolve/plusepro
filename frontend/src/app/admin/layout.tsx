'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    // Redirect if not super admin
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [token, user, fetchProfile, router]);

  if (!token || (user && user.role !== 'SUPER_ADMIN')) return null;

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
