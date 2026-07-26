'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { ToastProvider } from '@/context/ToastContext';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith('/dashboard') || pathname === '/login' || pathname === '/register';

  if (isAppRoute) {
    return (
      <ToastProvider>
        <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </ToastProvider>
  );
}
