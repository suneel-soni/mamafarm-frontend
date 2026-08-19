'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardAPI } from '@/services/api';
import { SalesPerformanceData } from '@/types';
import { TrendingUp, ArrowUpRight, Award, BarChart3, ChevronRight, PackageCheck, RefreshCw, DollarSign, Wallet, Zap, Receipt, Calendar } from 'lucide-react';
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
  LabelList,
} from 'recharts';

export default function SalesPerformancePage() {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

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

  const activeChartData = useMemo(() => {
    if (!salesData) return [];
    if (timeframe === 'weekly') {
      if (salesData.weeklyGraph && salesData.weeklyGraph.length > 0) {
        return salesData.weeklyGraph.map((item) => ({
          label: item.week,
          sales: item.sales,
          deliveries: item.deliveries,
        }));
      }
      // Fallback: Group dailyGraph into 7-day windows if weeklyGraph is empty
      const daily = salesData.dailyGraph || [];
      const weeks: { label: string; sales: number; deliveries?: number }[] = [];
      const chunkSize = 7;
      for (let i = 0; i < daily.length; i += chunkSize) {
        const chunk = daily.slice(i, i + chunkSize);
        const totalSales = chunk.reduce((sum, d) => sum + (d.sales || 0), 0);
        const totalDeliv = chunk.reduce((sum, d) => sum + (d.deliveries || 0), 0);
        const start = chunk[0]?.date || '';
        const end = chunk[chunk.length - 1]?.date || '';
        weeks.push({
          label: start === end ? start : `${start} - ${end}`,
          sales: totalSales,
          deliveries: totalDeliv,
        });
      }
      return weeks;
    }
    return (salesData.dailyGraph || []).map((item) => ({
      label: item.date,
      sales: item.sales,
      deliveries: item.deliveries,
    }));
  }, [timeframe, salesData]);

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
  const totalSalesAllTime = salesData.totalSalesAllTime ?? salesData.totalRevenue ?? 0;
  const totalDeliveredPackets = salesData.totalDeliveredPackets ?? 0;
  const totalDeliveredAmount = salesData.totalDeliveredAmount ?? 0;
  const totalReplacedPackets = salesData.totalReplacedPackets ?? 0;
  const totalReplacedAmount = salesData.totalReplacedAmount ?? 0;
  const totalCollectionAllTime = Math.max(0, totalSalesAllTime - pendingCollection - totalReplacedAmount);
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

        {/* 2, 3 & 4 Column Touch Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Today's Sales</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </p>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
              ₹{todaySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-emerald-400/80 mt-0.5 flex items-center gap-0.5 font-bold">
              <ArrowUpRight className="w-3 h-3" /> Live
            </p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Due</span>
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
            </p>
            <p className="text-lg font-extrabold text-amber-400 mt-0.5">
              ₹{pendingCollection.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-amber-300 mt-0.5 font-bold">Shop Dues</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Weekly Sales</span>
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            </p>
            <p className="text-base font-bold text-emerald-300 mt-0.5">
              ₹{weeklySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-slate-500">7 Days</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Monthly Sales</span>
              <BarChart3 className="w-3.5 h-3.5 text-slate-300" />
            </p>
            <p className="text-base font-bold text-white mt-0.5">
              ₹{monthlySales.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-slate-500">This Month</p>
          </div>

          <div className="bg-slate-900/90 border border-teal-900/50 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Sales</span>
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            </p>
            <p className="text-base font-extrabold text-teal-400 mt-0.5">
              ₹{totalSalesAllTime.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-teal-300/80 mt-0.5 font-semibold">
              Lifetime Sales
            </p>
          </div>

          <div className="bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Collection</span>
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            </p>
            <p className="text-base font-extrabold text-indigo-400 mt-0.5">
              ₹{totalCollectionAllTime.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-indigo-300/80 mt-0.5 font-semibold">
              Sales - Due - Replaced
            </p>
          </div>

          <div className="bg-slate-900/90 border border-blue-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Delivered</span>
              <PackageCheck className="w-3.5 h-3.5 text-blue-400" />
            </p>
            <p className="text-base font-extrabold text-blue-400 mt-0.5">
              {totalDeliveredPackets.toLocaleString('en-IN')} <span className="text-xs font-semibold text-blue-300/80">Pkts</span>
            </p>
            <p className="text-[9px] text-blue-300/80 mt-0.5 font-semibold truncate">
              Value: ₹{totalDeliveredAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-purple-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Replaced</span>
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            </p>
            <p className="text-base font-extrabold text-purple-400 mt-0.5">
              {totalReplacedPackets.toLocaleString('en-IN')} <span className="text-xs font-semibold text-purple-300/80">Pkts</span>
            </p>
            <p className="text-[9px] text-purple-300/80 mt-0.5 font-semibold truncate">
              Value: ₹{totalReplacedAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Daily / Weekly Sales Trajectory Chart */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 justify-between w-full">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs">
                  {timeframe === 'daily' ? 'Daily Sales Trajectory' : 'Weekly Sales Trajectory'}
                </h3>
              </div>
              <span className="text-[9px] text-slate-400">
                {timeframe === 'daily' ? '14 Days' : '8 Weeks'}
              </span>
            </div>

            {/* Daily / Weekly Switch Button */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-emerald-900/40 text-[10px]">
              <button
                type="button"
                onClick={() => setTimeframe('daily')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeframe === 'daily'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeframe === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 18, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#059669', borderRadius: '10px', fontSize: '10px' }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  dot={{ r: 3, fill: '#10b981', stroke: '#064e3b', strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: '#34d399' }}
                >
                  <LabelList
                    dataKey="sales"
                    position="top"
                    offset={6}
                    fill="#34d399"
                    fontSize={8}
                    fontWeight="bold"
                    formatter={(v: any) => (v ? `₹${Number(v) >= 10000 ? `${(Number(v) / 1000).toFixed(1)}k` : Number(v).toLocaleString('en-IN')}` : '')}
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales vs Collection Chart */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <h3 className="font-bold text-white text-xs">Monthly Sales vs Collections</h3>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData.monthlyGraph || []} margin={{ top: 18, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#059669', borderRadius: '10px', fontSize: '10px' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} name="Sales">
                  <LabelList
                    dataKey="sales"
                    position="top"
                    offset={4}
                    fill="#34d399"
                    fontSize={7.5}
                    fontWeight="bold"
                    formatter={(v: any) => (v ? `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(Number(v) % 1000 === 0 ? 0 : 1)}k` : v}` : '')}
                  />
                </Bar>
                <Bar dataKey="collections" fill="#14b8a6" radius={[3, 3, 0, 0]} name="Collections">
                  <LabelList
                    dataKey="collections"
                    position="top"
                    offset={4}
                    fill="#2dd4bf"
                    fontSize={7.5}
                    fontWeight="bold"
                    formatter={(v: any) => (v ? `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(Number(v) % 1000 === 0 ? 0 : 1)}k` : v}` : '')}
                  />
                </Bar>
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
                      src={shop.image || '/images/shop-placeholder.jpg'}
                      alt={shop.shopName || 'Shop'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                      {shop.shopName || 'Shop'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <span>₹{shopSales.toLocaleString('en-IN')}</span>
                      <span className="text-slate-400 font-medium">({(shop.deliveredQty ?? 0).toLocaleString('en-IN')} Pkts)</span>
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

