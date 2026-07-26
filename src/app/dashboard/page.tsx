'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { dashboardAPI } from '@/services/api';
import { DashboardKPIs } from '@/types';
import {
  TrendingUp,
  Store,
  Wheat,
  Truck,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Leaf,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await dashboardAPI.getSummary();
        if (res.success && res.data) {
          setKpis(res.data.kpis);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Mobile Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 border border-emerald-900/50 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[9px] font-bold uppercase">
              Operational Overview
            </span>
            <h1 className="text-base font-bold text-white mt-1">MamaFarm Tracker</h1>
            <p className="text-[10px] text-slate-300">Sprouts Production & Retail Dispatches</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* 2-Column Touch Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/dashboard/sales"
            className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md hover:border-emerald-500/50 transition-all"
          >
            <p className="text-[10px] text-slate-400 font-semibold">Total Dispatches</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">
              ₹{(kpis?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-emerald-400/80 mt-0.5 flex items-center gap-0.5 font-bold">
              <ArrowUpRight className="w-3 h-3" /> View Sales
            </p>
          </Link>

          <Link
            href="/dashboard/shops"
            className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md hover:border-emerald-500/50 transition-all"
          >
            <p className="text-[10px] text-slate-400 font-semibold">Pending Shop Dues</p>
            <p className="text-base font-extrabold text-amber-400 mt-0.5">
              ₹{(kpis?.totalShopDues || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-amber-300 mt-0.5 font-bold">Retail Partners</p>
          </Link>

          <Link
            href="/dashboard/materials"
            className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md hover:border-emerald-500/50 transition-all"
          >
            <p className="text-[10px] text-slate-400 font-semibold">Material Purchase Cost</p>
            <p className="text-base font-bold text-white mt-0.5">
              ₹{(kpis?.totalMaterialCost || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">Raw Grain & Pouches</p>
          </Link>

          <Link
            href="/dashboard/inventory"
            className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md hover:border-emerald-500/50 transition-all"
          >
            <p className="text-[10px] text-slate-400 font-semibold">Sprouts Stock</p>
            <p className="text-base font-bold text-teal-300 mt-0.5">
              {kpis?.sproutsStock || 0} Packets
            </p>
            <p className="text-[9px] text-teal-400 mt-0.5 font-bold">In Cold Storage</p>
          </Link>
        </div>

        {/* Quick Action Touch Buttons */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <h3 className="font-bold text-white text-xs">Quick Operational Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/deliveries"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Order</span>
            </Link>

            <Link
              href="/dashboard/materials"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-emerald-900/40 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Wheat className="w-4 h-4 text-emerald-400" />
              <span>Add Purchase</span>
            </Link>
          </div>
        </div>

        {/* Navigation Shortcuts Stack */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <h3 className="font-bold text-white text-xs">Primary Modules</h3>
          <div className="space-y-1.5">
            <Link
              href="/dashboard/sales"
              className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-emerald-900/30 hover:bg-emerald-900/20 text-xs font-semibold text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Sales Performance & Trajectory</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/dashboard/shops"
              className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-emerald-900/30 hover:bg-emerald-900/20 text-xs font-semibold text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Retail Partner Shops & Ledgers</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/dashboard/materials"
              className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-emerald-900/30 hover:bg-emerald-900/20 text-xs font-semibold text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Wheat className="w-4 h-4 text-emerald-400" />
                <span>Raw Grain & Pouch Purchases</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/dashboard/deliveries"
              className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-emerald-900/30 hover:bg-emerald-900/20 text-xs font-semibold text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Orders & Dispatches</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
