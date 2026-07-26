'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { reportsAPI } from '@/services/api';
import { BarChart3, Download, Printer, TrendingUp, IndianRupee, Store, Calendar } from 'lucide-react';

import { useToast } from '@/context/ToastContext';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showWarning } = useToast();

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await reportsAPI.getReports();
        if (res.success) {
          setReportData(res.data);
          if (res.isFallback) showWarning('Server offline. Showing cached report data.');
        } else {
          showError(res.message || 'Failed to load business reports.');
        }
      } catch (err: any) {
        showError(err.message || 'Error loading business reports.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const summary = reportData?.summary || { totalRevenue: 89400, totalMaterialCost: 20300, totalExpenses: 15000, netProfit: 54100 };
  const pnl = reportData?.profitAndLoss || { grossRevenue: 89400, costOfGoodsSold: 20300, operatingExpenses: 15000, netProfitMargin: 60.5 };
  const shops = reportData?.shopPerformance || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-emerald-400 shrink-0" />
              Business Reports & Profit & Loss Statement
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Financial analysis, Cost of Goods Sold (COGS), operating margins and shop partner breakdowns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* P&L Executive Statement */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Profit & Loss Summary Statement</h3>
              <p className="text-xs text-slate-400">MamaFarm Organic Sprouts Manufacturing</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Margin: {pnl.netProfitMargin}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-900/30">
              <p className="text-xs text-slate-400">Gross Sales Revenue</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-900/30">
              <p className="text-xs text-slate-400">Raw Material COGS</p>
              <p className="text-xl font-bold text-rose-300 mt-1">₹{(summary.totalMaterialCost || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-900/30">
              <p className="text-xs text-slate-400">Operating Expenses</p>
              <p className="text-xl font-bold text-rose-400 mt-1">₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-gradient-to-tr from-emerald-950 to-teal-950 p-4 rounded-xl border border-emerald-700/60">
              <p className="text-xs text-emerald-300 font-semibold">Net Business Profit</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">₹{(summary.netProfit || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Shop Wise Performance */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">Shop-wise Revenue & Outstanding Dues</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-3">Shop Partner</th>
                  <th className="p-3">Total Delivered Value</th>
                  <th className="p-3">Total Collected</th>
                  <th className="p-3">Outstanding Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {shops.map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-white">{s.shopName}</td>
                    <td className="p-3 text-slate-200">₹{s.totalDelivered}</td>
                    <td className="p-3 text-emerald-300 font-bold">₹{s.totalPaid}</td>
                    <td className="p-3 text-amber-300 font-bold">₹{s.outstanding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
