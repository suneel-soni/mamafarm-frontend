'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { deliveriesAPI, shopsAPI } from '@/services/api';
import { Delivery, Shop } from '@/types';
import {
  Truck,
  Check,
  X,
  Store,
  Loader2,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { formatDateIST } from '@/utils/dateUtils';

type PaymentFilter = 'all' | 'paid' | 'partial' | 'unpaid';
type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const { showError, showWarning } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, shopRes] = await Promise.all([
        deliveriesAPI.getAll(),
        shopsAPI.getAll(),
      ]);
      if (delRes.success) setDeliveries(delRes.data || []);
      if (shopRes.success) setShops(shopRes.data || []);

      if (delRes.isFallback || shopRes.isFallback) {
        showWarning('Server offline. Displaying cached deliveries.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load delivery records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Filtered Deliveries ---
  const filteredDeliveries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    return deliveries.filter((del) => {
      // 1. Text Search
      if (query) {
        const delNum = (del.deliveryNumber || '').toLowerCase();
        const shop = (del.shopName || '').toLowerCase();
        const driver = (del.deliveryPerson || '').toLowerCase();
        const itemsStr = (del.items || []).map((i) => i.sproutType).join(' ').toLowerCase();

        const matchesQuery =
          delNum.includes(query) ||
          shop.includes(query) ||
          driver.includes(query) ||
          itemsStr.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const net = Number(del.netAmount || 0);
        const paid = Number(del.amountPaid || 0);
        const due = Math.max(0, net - paid);
        const isPaid = due <= 0 || del.paymentStatus === 'paid';
        const isPartial = due > 0 && paid > 0 && del.paymentStatus === 'partial';

        if (statusFilter === 'paid' && !isPaid) return false;
        if (statusFilter === 'partial' && (!isPartial && del.paymentStatus !== 'partial')) return false;
        if (statusFilter === 'unpaid' && (isPaid || (paid > 0 && due > 0))) return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'all') {
        const delDateObj = new Date(del.deliveryDate || del.createdAt || '');
        if (isNaN(delDateObj.getTime())) return true;

        const delDateStr = delDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        if (dateFilter === 'today') {
          if (delDateStr !== todayStr) return false;
        } else if (dateFilter === 'week') {
          const diffDays = (now.getTime() - delDateObj.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === 'month') {
          const diffDays = (now.getTime() - delDateObj.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [deliveries, searchQuery, statusFilter, dateFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-xl shadow-inner text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Deliveries & Dispatches
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete tabular log of all sprouts dispatches, retail partner orders, and payment records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-emerald-900/40 hover:border-emerald-700/60 text-slate-300 hover:text-emerald-400 rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900/85 border border-emerald-900/40 rounded-2xl p-3 sm:p-4 shadow-md space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Delivery #, Shop Name, Sprout Variety, or Driver..."
                className="w-full bg-slate-950/80 border border-emerald-900/40 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Quick Filter */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-emerald-900/30 shrink-0 text-xs overflow-x-auto">
              {(['all', 'today', 'week', 'month'] as DateFilter[]).map((df) => (
                <button
                  key={df}
                  onClick={() => setDateFilter(df)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-all text-[11px] ${
                    dateFilter === df
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {df === 'all' ? 'All Time' : df === 'today' ? 'Today' : df === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Filter Pills - Horizontally Swipeable */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-emerald-900/20">
            {/* Horizontal Swipeable Container */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-400" /> Status:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {(['all', 'paid', 'partial', 'unpaid'] as PaymentFilter[]).map((st) => {
                  const count =
                    st === 'all'
                      ? deliveries.length
                      : st === 'paid'
                      ? deliveries.filter((d) => (d.netAmount || 0) <= (d.amountPaid || 0) || d.paymentStatus === 'paid').length
                      : st === 'partial'
                      ? deliveries.filter((d) => (d.amountPaid || 0) > 0 && (d.netAmount || 0) > (d.amountPaid || 0)).length
                      : deliveries.filter((d) => (d.amountPaid || 0) === 0 && d.paymentStatus === 'unpaid').length;

                  const isSelected = statusFilter === st;

                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? st === 'paid'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : st === 'partial'
                            ? 'bg-amber-600 text-white shadow-md'
                            : st === 'unpaid'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-700 text-white shadow-md'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-emerald-900/20'
                      }`}
                    >
                      <span>{st}</span>
                      <span className="text-[9px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Counts & Reset */}
            <div className="flex items-center gap-2.5 shrink-0 text-right">
              <span className="text-[11px] text-slate-400 whitespace-nowrap hidden sm:inline">
                Showing <strong className="text-white">{filteredDeliveries.length}</strong> of{' '}
                <strong className="text-white">{deliveries.length}</strong>
              </span>

              {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="text-[11px] text-emerald-400 hover:underline font-semibold whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- PURE TABULAR REPRESENTATION (DISPLAY ONLY) --- */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-3.5">Delivery #</th>
                  <th className="p-3.5">Shop Partner</th>
                  <th className="p-3.5">Delivered Sprouts</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Executive</th>
                  <th className="p-3.5">Total (₹)</th>
                  <th className="p-3.5">Paid (₹)</th>
                  <th className="p-3.5">Due (₹)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                        <span>Loading delivery records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="w-8 h-8 text-slate-600" />
                        <span className="font-semibold text-slate-300">No delivery dispatches found.</span>
                        <span className="text-[11px] text-slate-500">
                          Try adjusting search keywords or clearing filters.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((del) => {
                    const net = Number(del.netAmount || 0);
                    const paid = Number(del.amountPaid || 0);
                    const due = Math.max(0, net - paid);
                    const isPaid = due <= 0 || del.paymentStatus === 'paid';
                    const isPartial = due > 0 && paid > 0;

                    const shopId = typeof del.shop === 'string' ? del.shop : (del.shop as any)?._id || (del as any).shopId || '';
                    const totalPkts = (del.items || []).reduce((acc, i) => acc + Number(i.quantity || 0), 0);

                    return (
                      <tr key={del._id} className="hover:bg-emerald-950/20 transition-colors group">
                        {/* Delivery Number */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold text-white font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-emerald-900/40 text-[11px]">
                            {del.deliveryNumber}
                          </span>
                        </td>

                        {/* Retail Shop Partner */}
                        <td className="p-3.5 min-w-[160px]">
                          {shopId ? (
                            <Link
                              href={`/dashboard/shops/details?id=${shopId}`}
                              className="font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 group/link"
                            >
                              <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                              <span className="group-hover/link:underline">{del.shopName}</span>
                              <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{del.shopName}</span>
                            </div>
                          )}
                        </td>

                        {/* Delivered Sprouts Items */}
                        <td className="p-3.5 min-w-[200px]">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {(del.items || []).map((it, idx) => (
                                <span
                                  key={idx}
                                  className="bg-slate-800/80 text-slate-200 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700/50"
                                >
                                  {it.quantity}x {it.sproutType}
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              Total: {totalPkts} pkts
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3.5 text-slate-300 whitespace-nowrap font-medium">
                          {formatDateIST(del.deliveryDate || del.createdAt)}
                        </td>

                        {/* Executive / Driver */}
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{del.deliveryPerson || 'Driver'}</span>
                          </div>
                        </td>

                        {/* Total Bill */}
                        <td className="p-3.5 font-bold text-white text-xs whitespace-nowrap">
                          ₹{net.toLocaleString('en-IN')}
                        </td>

                        {/* Collected */}
                        <td className="p-3.5 font-bold text-emerald-400 text-xs whitespace-nowrap">
                          ₹{paid.toLocaleString('en-IN')}
                        </td>

                        {/* Balance Due */}
                        <td className="p-3.5 whitespace-nowrap">
                          {due > 0 ? (
                            <span className="font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 text-xs">
                              ₹{due.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">₹0</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isPaid
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                : isPartial
                                ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                                : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Paid
                              </>
                            ) : isPartial ? (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" /> Partial
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-400" /> Unpaid
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
