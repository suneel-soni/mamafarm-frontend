'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardAPI } from '@/services/api';
import { SalesPerformanceData } from '@/types';
import { TrendingUp, ArrowUpRight, Award, BarChart3, ChevronRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function SalesPerformancePage() {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const { showError, showWarning } = useToast();

  useEffect(() => {
    async function loadSales() {
      setLoading(true);
      try {
        const res = await dashboardAPI.getSalesPerformance();
        if (res.success) {
          setSalesData(res.data);
          if (res.isFallback) showWarning('Server offline. Showing cached sales analytics.');
        } else {
          showError(res.message || 'Failed to load sales analytics.');
        }
      } catch (err: any) {
        showError(err.message || 'Error loading sales performance.');
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  if (loading || !salesData) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-xs">Loading sales analytics...</div>
      </DashboardLayout>
    );
  }

  const todaySales = salesData.todaySales ?? 0;
  const pendingCollection = salesData.pendingCollection ?? 0;
  const weeklySales = salesData.weeklySales ?? 0;
  const monthlySales = salesData.monthlySales ?? 0;
  const topShops = salesData.topPerformingShops || [];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Mobile Header Banner */}
        <div className="bg-slate-900 border border-emerald-900/40 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Sales Analytics
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time daily dispatches & collections</p>
          </div>
          <div className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[10px] font-bold">
            Live
          </div>
        </div>

        {/* 2-Column Touch Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold">Today's Sales</p>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
              ₹{todaySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-emerald-400/80 mt-0.5 flex items-center gap-0.5 font-bold">
              <ArrowUpRight className="w-3 h-3" /> Live
            </p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold">Pending Collection</p>
            <p className="text-lg font-extrabold text-amber-400 mt-0.5">
              ₹{pendingCollection.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-amber-300 mt-0.5 font-bold">Shop Dues</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold">Weekly Sales</p>
            <p className="text-base font-bold text-emerald-300 mt-0.5">
              ₹{weeklySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-slate-500">7 Days</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold">Monthly Sales</p>
            <p className="text-base font-bold text-white mt-0.5">
              ₹{monthlySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-slate-500">This Month</p>
          </div>
        </div>

        {/* Daily Sales Trajectory Chart */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Daily Sales Trajectory
            </h3>
            <span className="text-[9px] text-slate-400">14 Days</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData.dailyGraph || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#059669', borderRadius: '10px', fontSize: '10px' }}
                  formatter={(v: any) => [`₹${v}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales vs Collection Chart */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <h3 className="font-bold text-white text-xs">Monthly Sales vs Collections</h3>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData.monthlyGraph || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#059669', borderRadius: '10px', fontSize: '10px' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} name="Sales" />
                <Bar dataKey="collections" fill="#14b8a6" radius={[3, 3, 0, 0]} name="Collections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Shops List */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs">Top Partner Shops</h3>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Click to view shop details</span>
          </div>

          <div className="space-y-2">
            {topShops.map((shop, idx) => {
              const shopSales = shop.totalSales ?? shop.deliveredQty ?? 0;
              const targetId = shop._id;
              return (
                <div
                  key={targetId || idx}
                  onClick={() => {
                    if (targetId) {
                      router.push(`/dashboard/shops/details?id=${targetId}`);
                    }
                  }}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-emerald-900/40 hover:border-emerald-600/60 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.99] group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 shrink-0">
                    <img
                      src={shop.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
                      alt={shop.shopName || 'Shop'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                      {shop.shopName || 'Shop'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold">
                      ₹{shopSales.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

