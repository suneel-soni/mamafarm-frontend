'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';
import {
  TrendingUp,
  Store,
  Wheat,
  Truck,
  Plus,
  X,
  CreditCard,
  Factory,
  Boxes,
  LogOut,
  MoreHorizontal,
  Receipt,
  UserCheck,
  Check,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('mamafarm_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await authAPI.getMe();
        if (!res || !res.success) {
          localStorage.removeItem('mamafarm_token');
          router.push('/login');
          return;
        }
        setIsCheckingAuth(false);
      } catch {
        localStorage.removeItem('mamafarm_token');
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const bottomTabs = [
    { label: 'Sales', href: '/dashboard/sales', icon: TrendingUp },
    { label: 'Shops', href: '/dashboard/shops', icon: Store },
    { label: 'Materials', href: '/dashboard/materials', icon: Wheat },
    { label: 'Orders', href: '/dashboard/deliveries', icon: Truck },
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mamafarm_token');
    }
    router.push('/login');
  };

  const currentTab = bottomTabs.find((t) => t.href === pathname) || {
    label: 'MamaFarm Mobile Tracker',
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#11180d] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#8B7E2A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11180d] text-slate-100 flex justify-center selection:bg-[#283C06] selection:text-[#F4EDD6] antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#283C06] text-[#FEFEFE] px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce max-w-xs w-full text-xs border border-[#8B7E2A]/40">
          <Check className="w-4 h-4 shrink-0 text-[#8B7E2A]" />
          <span className="font-semibold truncate">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Mobile Device Container */}
      <div className="w-full max-w-md bg-[#11180d] border-x border-[#283C06]/40 min-h-screen flex flex-col relative shadow-2xl pb-20">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 bg-[#162111]/95 backdrop-blur-md border-b border-[#283C06]/50 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEFEFE] p-0.5 shrink-0 border border-[#8B7E2A]/40 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="MamaFarm Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-base text-[#8B7E2A]">{currentTab.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/deliveries"
              className="bg-[#283C06] hover:bg-[#345108] text-[#FEFEFE] p-2 rounded-xl text-xs font-bold flex items-center justify-center shadow-md shadow-[#283C06]/40 border border-[#8B7E2A]/30"
              title="New Order Dispatch"
            >
              <Plus className="w-4 h-4 text-[#8B7E2A]" />
            </Link>
            <button
              onClick={() => setMoreMenuOpen(true)}
              className="bg-[#1e2a16] border border-[#283C06]/60 text-slate-300 p-2 rounded-xl"
            >
              <MoreHorizontal className="w-4 h-4 text-[#8B7E2A]" />
            </button>
          </div>
        </header>

        {/* Screen Content View */}
        <main className="flex-1 p-3.5 space-y-4">{children}</main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#162111]/95 backdrop-blur-lg border-t border-[#283C06]/50 z-40 flex items-center justify-around py-2 px-1">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (pathname === '/dashboard' && tab.href === '/dashboard/sales');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-[#8B7E2A] font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#8B7E2A]' : 'text-slate-400'}`} />
                <span className="text-[10px]">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              moreMenuOpen ? 'text-[#8B7E2A] font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 text-slate-400" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>

        {/* Slide-Up Mobile Sheet (More Menu) */}
        {moreMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-[#162111] border-t border-[#283C06]/60 rounded-t-3xl p-5 space-y-4 shadow-2xl max-w-md w-full mx-auto animate-in slide-in-from-bottom duration-200">
              <div className="flex justify-between items-center border-b border-[#283C06]/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FEFEFE] p-0.5 border border-[#8B7E2A]/40">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-bold text-[#FEFEFE] text-sm">
                    Mama Farm Options
                  </h3>
                </div>
                <button onClick={() => setMoreMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/payments"
                  onClick={() => setMoreMenuOpen(false)}
                  className="bg-[#1e2a16] border border-[#283C06]/50 p-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-200 hover:bg-[#283C06]/30"
                >
                  <CreditCard className="w-4 h-4 text-[#8B7E2A]" />
                  <span>Payments Ledger</span>
                </Link>

                <Link
                  href="/dashboard/production"
                  onClick={() => setMoreMenuOpen(false)}
                  className="bg-[#1e2a16] border border-[#283C06]/50 p-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-200 hover:bg-[#283C06]/30"
                >
                  <Factory className="w-4 h-4 text-[#8B7E2A]" />
                  <span>Production Batches</span>
                </Link>

                <Link
                  href="/dashboard/inventory"
                  onClick={() => setMoreMenuOpen(false)}
                  className="bg-[#1e2a16] border border-[#283C06]/50 p-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-200 hover:bg-[#283C06]/30"
                >
                  <Boxes className="w-4 h-4 text-[#8B7E2A]" />
                  <span>Stock Matrix</span>
                </Link>

                <Link
                  href="/dashboard/suppliers"
                  onClick={() => setMoreMenuOpen(false)}
                  className="bg-[#1e2a16] border border-[#283C06]/50 p-3 rounded-2xl flex items-center gap-3 text-xs font-semibold text-slate-200 hover:bg-[#283C06]/30"
                >
                  <Receipt className="w-4 h-4 text-[#8B7E2A]" />
                  <span>Grain Suppliers</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-[#283C06]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#8B7E2A]" />
                  <span className="text-xs text-slate-300 font-medium">Logged in as Manager</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-900/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
