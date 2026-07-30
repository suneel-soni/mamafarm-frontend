'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { shopsAPI, deliveriesAPI, returnsAPI, paymentsAPI } from '@/services/api';
import {
  MapPin,
  Phone,
  ArrowLeft,
  Plus,
  RotateCcw,
  RefreshCw,
  FileText,
  X,
  Check,
  Loader2,
  Banknote,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys, sanitizeInteger, sanitizeDecimal } from '@/utils/inputValidation';
import { formatDateTimeIST, formatDateIST } from '@/utils/dateUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ShopDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shopId = (searchParams?.get('id') as string) || (params?.id as string) || '';

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Order Form State
  const [sproutType, setSproutType] = useState('Moong Sprouts');
  const [orderQty, setOrderQty] = useState(5);
  const [orderRate, setOrderQtyRate] = useState(20);
  const [amountPaid, setAmountPaid] = useState(0);

  // Return / Replacement Form State
  const [recordType, setRecordType] = useState<'return' | 'replacement'>('return');
  const [returnSproutType, setReturnSproutType] = useState('Moong Sprouts');
  const [returnQty, setReturnQty] = useState(1);
  const [returnRate, setReturnRate] = useState(0);
  const [returnReason, setReturnReason] = useState('Unsold / Expired Return');

  // Edit Return / Replacement Modal State
  const [editReturnModalOpen, setEditReturnModalOpen] = useState(false);
  const [editingReturnId, setEditingReturnId] = useState('');
  const [editRecordType, setEditRecordType] = useState<'return' | 'replacement'>('return');
  const [editReturnSproutType, setEditReturnSproutType] = useState('Moong Sprouts');
  const [editReturnQty, setEditReturnQty] = useState<number | string>(1);
  const [editReturnRate, setEditReturnRate] = useState<number | string>(0);
  const [editReturnReason, setEditReturnReason] = useState('Unsold / Expired Return');

  // Later Paid Payment State
  const [selectedDeliveryForPayment, setSelectedDeliveryForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Edit Order Modal State
  const [editOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = useState('');
  const [editSproutType, setEditSproutType] = useState('Moong Sprouts');
  const [editOrderQty, setEditOrderQty] = useState<number | string>(5);
  const [editOrderRate, setEditOrderRate] = useState<number | string>(20);
  const [editAmountPaid, setEditAmountPaid] = useState<number | string>(0);

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Order Handlers ---
  const openOrderModal = () => {
    setSproutType('Moong Sprouts');
    setOrderQty(5);
    setOrderQtyRate(20);
    setAmountPaid(0);
    setOrderModalOpen(true);
  };

  const openEditOrderModal = (entry: any) => {
    const deliveryId = entry._id || entry.id;
    const rawDelivery = details?.deliveries?.find((d: any) => String(d._id || d.id) === String(deliveryId))
      || details?.deliveryHistory?.find((d: any) => String(d._id || d.id) === String(deliveryId))
      || entry;

    setEditingDeliveryId(deliveryId);
    const item = rawDelivery.items?.[0] || {};
    setEditSproutType(item.sproutType || 'Moong Sprouts');
    setEditOrderQty(item.quantity !== undefined ? item.quantity : 1);
    setEditOrderRate(item.rate !== undefined ? item.rate : 20);
    setEditAmountPaid(rawDelivery.amountPaid !== undefined ? rawDelivery.amountPaid : (entry.amountPaid || 0));
    setEditOrderModalOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeliveryId) return;
    setIsSubmitting(true);
    try {
      const qty = Number(editOrderQty);
      const rate = Number(editOrderRate);
      const amtPaid = Number(editAmountPaid);
      const totalAmount = qty * rate;

      const payload = {
        items: [
          {
            sproutType: editSproutType,
            quantity: qty,
            unit: 'packets',
            rate: rate,
            amount: totalAmount,
          },
        ],
        amountPaid: amtPaid,
        paymentStatus: amtPaid >= totalAmount ? 'paid' : amtPaid > 0 ? 'partial' : 'unpaid',
      };

      const res = await deliveriesAPI.update(editingDeliveryId, payload);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Delivery updated locally.');
        else showSuccess('Dispatch Order Updated Successfully!');
        setEditOrderModalOpen(false);
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to update delivery.');
      }
    } catch (err: any) {
      showError(err.message || 'Error updating delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (deliveryId: string) => {
    if (!deliveryId) return;
    if (!window.confirm('Are you sure you want to delete this dispatch order from ledger?')) return;
    setIsSubmitting(true);
    try {
      const res = await deliveriesAPI.delete(deliveryId);
      if (res.success) {
        showSuccess('Dispatch order deleted from ledger.');
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to delete delivery.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Replacement Handlers ---
  const openReturnModal = (type: 'return' | 'replacement' = 'replacement') => {
    setRecordType('replacement');
    setReturnSproutType('Moong Sprouts');
    setReturnQty(1);
    setReturnRate(0);
    setReturnReason('Expired Packet Replacement');
    setReturnModalOpen(true);
  };

  const openEditReturnModal = (entry: any) => {
    const returnId = entry._id || entry.id;
    const rawReturn = details?.returns?.find((r: any) => String(r._id || r.id) === String(returnId)) || entry;

    setEditingReturnId(returnId);
    setEditRecordType('replacement');
    const item = rawReturn.items?.[0] || entry.items?.[0] || {};
    setEditReturnSproutType(item.sproutType || 'Moong Sprouts');
    setEditReturnQty(item.quantity !== undefined ? item.quantity : 1);
    setEditReturnRate(item.rate !== undefined ? item.rate : 20);
    setEditReturnReason(rawReturn.reason || entry.reason || 'Expired Packet Replacement');
    setEditReturnModalOpen(true);
  };

  const handleReturnOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const qty = Number(returnQty);
      const rate = Number(returnRate);
      const payload = {
        shopId,
        type: 'replacement',
        isReplacement: true,
        reason: returnReason || 'Expired Packet Replacement',
        items: [
          {
            sproutType: returnSproutType,
            quantity: qty,
            unit: 'packets',
            rate: rate,
            amount: 0,
          },
        ],
        totalRefundAmount: 0,
      };

      const res = await returnsAPI.create(payload);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Replacement recorded locally (Offline mode).');
        else showSuccess('Packet Replacement Recorded!');
        setReturnModalOpen(false);
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to record replacement.');
      }
    } catch (err: any) {
      showError(err.message || 'Error recording entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturnId) return;
    setIsSubmitting(true);
    try {
      const qty = Number(editReturnQty);
      const rate = Number(editReturnRate);
      const payload = {
        type: 'replacement',
        isReplacement: true,
        reason: editReturnReason || 'Expired Packet Replacement',
        items: [
          {
            sproutType: editReturnSproutType,
            quantity: qty,
            unit: 'packets',
            rate: rate,
            amount: 0,
          },
        ],
        totalRefundAmount: 0,
      };

      const res = await returnsAPI.update(editingReturnId, payload);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Record updated locally.');
        else showSuccess('Replacement Record Updated Successfully!');
        setEditReturnModalOpen(false);
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to update record.');
      }
    } catch (err: any) {
      showError(err.message || 'Error updating replacement record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!returnId) return;
    if (!window.confirm('Are you sure you want to delete this return/replacement record from ledger?')) return;
    setIsSubmitting(true);
    try {
      const res = await returnsAPI.delete(returnId);
      if (res.success) {
        showSuccess('Record deleted from ledger.');
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to delete record.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Payment Handlers ---
  const openPaymentModal = (defaultAmt?: number, note?: string) => {
    setSelectedDeliveryForPayment(null);
    const due = defaultAmt !== undefined ? defaultAmt : (summary?.pendingPayment || 0);
    setPaymentAmount(due > 0 ? due : 0);
    setPaymentNotes(note || '');
    setTransactionRef('');
    setPaymentMethod('cash');
    setPaymentModalOpen(true);
  };

  const openPaymentModalForDelivery = (entry: any) => {
    const due = Math.max(0, (entry.debit || 0) - (entry.amountPaid || 0));
    setSelectedDeliveryForPayment(entry);
    setPaymentAmount(due > 0 ? due : entry.debit || 0);
    setPaymentNotes(`Cash collected for dispatch order (${entry.reference})`);
    setTransactionRef('');
    setPaymentMethod('cash');
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(paymentAmount) <= 0) {
      showError('Please enter a valid payment amount greater than zero.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedDeliveryForPayment && (selectedDeliveryForPayment.id || selectedDeliveryForPayment._id)) {
        const delId = selectedDeliveryForPayment.id || selectedDeliveryForPayment._id;
        const newPaid = (selectedDeliveryForPayment.amountPaid || 0) + Number(paymentAmount);
        const newStatus = newPaid >= selectedDeliveryForPayment.debit ? 'paid' : 'partial';

        const delRes = await deliveriesAPI.update(delId, {
          amountPaid: newPaid,
          paymentStatus: newStatus,
        });

        await paymentsAPI.create({
          entityType: 'shop',
          shopId,
          amount: Number(paymentAmount),
          paymentMethod,
          transactionRef,
          notes: paymentNotes || `Cash collected for dispatch order (${selectedDeliveryForPayment.reference})`,
          paymentDate: new Date().toISOString(),
        });

        if (delRes.success) {
          showSuccess(`Order ${selectedDeliveryForPayment.reference} marked as paid!`);
        } else {
          showSuccess('Payment recorded & dispatch status updated!');
        }
      } else {
        const payload = {
          entityType: 'shop',
          shopId,
          amount: Number(paymentAmount),
          paymentMethod,
          transactionRef,
          notes: paymentNotes || 'Later Paid Settlement',
          paymentDate: new Date().toISOString(),
        };

        const res = await paymentsAPI.create(payload);
        if (res.success) {
          if (res.isFallback) showWarning(res.message || 'Payment recorded locally (Offline mode).');
          else showSuccess('Payment Received & Account Ledger Updated!');
        } else {
          showError(res.message || 'Failed to record payment.');
        }
      }

      setPaymentModalOpen(false);
      setSelectedDeliveryForPayment(null);
      setPaymentAmount(0);
      setTransactionRef('');
      setPaymentNotes('');
      loadShopDetails();
    } catch (err: any) {
      showError(err.message || 'Error recording payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadShopDetails = async () => {
    setLoading(true);
    try {
      const res = await shopsAPI.getById(shopId);
      if (res.success && res.data) {
        setDetails(res.data);
        if (res.isFallback) showWarning('Server offline. Showing cached shop ledger.');
      } else {
        showError(res.message || 'Failed to load shop partner details.');
      }
    } catch (err: any) {
      showError(err.message || 'Error loading shop details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) loadShopDetails();
  }, [shopId]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        shopId,
        deliveryDate: new Date().toISOString(),
        items: [
          {
            sproutType,
            quantity: Number(orderQty),
            unit: 'packets',
            rate: Number(orderRate),
            amount: Number(orderQty) * Number(orderRate),
          },
        ],
        discount: 0,
        amountPaid: Number(amountPaid),
      };

      const res = await deliveriesAPI.create(payload);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Order dispatched locally (Offline mode).');
        else showSuccess('New Order Dispatched!');
        setOrderModalOpen(false);
        loadShopDetails();
      } else {
        showError(res.message || 'Failed to dispatch order.');
      }
    } catch (err: any) {
      showError(err.message || 'Error dispatching order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-xs">Loading shop details...</div>
      </DashboardLayout>
    );
  }

  // Normalize shop details from Atlas DB response vs nested fallback structure
  const shop = details?.shop || (details?._id || details?.shopName ? details : null);

  if (!shop) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400 text-xs space-y-3">
          <p>Shop details not found or shop ID invalid.</p>
          <button
            onClick={() => router.push('/dashboard/shops')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
          >
            Back to Shops
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const summary = details?.summary || {
    totalDeliveredQty: shop.totalDeliveredQuantity || 0,
    totalReturnedQty: shop.totalReturnedQuantity || 0,
    totalReplacedQty: shop.totalReplacedQuantity || 0,
    currentQuantity: shop.currentQuantity || (shop.totalDeliveredQuantity || 0) - (shop.totalReturnedQuantity || 0),
    totalDeliveredValue: shop.totalDeliveredValue || 0,
    totalPaidAmount: shop.totalPaidAmount || 0,
    pendingPayment: shop.outstandingBalance || 0,
  };

  const totalSalesVal = summary.totalDeliveredVal ?? summary.totalDeliveredValue ?? shop.totalDeliveredValue ?? 0;
  const totalSalesPayment = summary.totalPaid ?? summary.totalPaidAmount ?? shop.totalPaidAmount ?? 0;
  const pendingPaymentVal = summary.pendingPayment ?? shop.outstandingBalance ?? 0;

  const salesGraph = details?.salesGraph || [
    { date: 'Jul 15', amount: shop.totalDeliveredValue || 2400 },
    { date: 'Jul 18', amount: (shop.totalDeliveredValue || 2400) * 0.8 },
    { date: 'Jul 22', amount: shop.totalDeliveredValue || 3200 },
  ];

  const ledger = details?.ledger || (details?.deliveryHistory ? details.deliveryHistory.map((d: any) => ({
    date: formatDateTimeIST(d.deliveryDate || d.createdAt),
    type: 'delivery',
    reference: d.deliveryNumber || 'DEL-2026',
    description: `Dispatched ${d.items?.map((i: any) => `${i.quantity} ${i.sproutType}`).join(', ') || 'Sprouts'}`,
    debit: d.netAmount || 0,
    credit: 0,
    amountPaid: d.amountPaid || 0,
    paymentStatus: d.paymentStatus || ((d.amountPaid || 0) >= (d.netAmount || 0) ? 'paid' : (d.amountPaid || 0) > 0 ? 'partial' : 'unpaid'),
    balance: (d.netAmount || 0) - (d.amountPaid || 0),
  })) : []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Toast */}
        {toast && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 max-w-xs w-full text-xs">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-semibold truncate">{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back Link */}
        <button
          onClick={() => router.push('/dashboard/shops')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shops
        </button>

        {/* Shop Mobile Header Card */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-lg p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
              <img
                src={
                  shop?.image ||
                  '/images/shop-placeholder.jpg'
                }
                alt={shop?.shopName || 'Shop'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full text-[9px] font-bold uppercase">
                  Retail Partner
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-emerald-300 border border-emerald-800/40 rounded-full text-[9px] font-bold font-mono">
                  {shop?.shopCode || ''}
                </span>
              </div>
              <h1 className="text-sm font-bold text-white truncate mt-1">{shop?.shopName}</h1>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" /> {shop?.address || shop?.area || 'Market'}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" /> {shop?.phone || '+91 Contact'}
              </p>
            </div>
          </div>

          {/* Quick Action Mobile Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-emerald-900/30">
            <button
              onClick={openOrderModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-900/30"
            >
              <Plus className="w-3 h-3" /> Dispatch
            </button>
            <button
              onClick={() => openPaymentModal(summary.pendingPayment, 'Later Paid Settlement')}
              className="bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-amber-900/30"
            >
              <Banknote className="w-3 h-3" /> Pay Due
            </button>
            <button
              onClick={() => openReturnModal('replacement')}
              className="bg-slate-800 text-cyan-400 border border-cyan-900/40 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Replace
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Total Sales */}
          <div className="bg-slate-900/90 border border-emerald-900/50 rounded-2xl p-3 shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Total Sales</p>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">₹{totalSalesVal.toLocaleString('en-IN')}</p>
            </div>
            {pendingPaymentVal > 0 ? (
              <p className="text-[8px] font-bold text-amber-400 mt-1 truncate">
                Dispatched (Due: ₹{pendingPaymentVal.toLocaleString('en-IN')})
              </p>
            ) : (
              <p className="text-[8px] text-emerald-400 font-bold mt-1">Dispatched Value (Paid)</p>
            )}
          </div>

          {/* Pending Payment */}
          <div className="bg-slate-900/90 border border-amber-900/50 rounded-2xl p-3 shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-amber-300 uppercase font-semibold">Pending Payment</p>
              <p className="text-sm sm:text-base font-bold text-amber-400 mt-0.5">₹{pendingPaymentVal.toLocaleString('en-IN')}</p>
            </div>
            {pendingPaymentVal > 0 ? (
              <p className="text-[8px] text-amber-300/90 font-bold truncate mt-1">
                Due: ₹{pendingPaymentVal.toLocaleString('en-IN')} {summary.dueSyncDate ? `(${summary.dueSyncDate})` : ''}
              </p>
            ) : (
              <p className="text-[8px] text-emerald-400 font-bold mt-1">✓ Fully Settled (No Due)</p>
            )}
          </div>

          {/* Total Delivered */}
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Total Delivered</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">{summary.totalDeliveredQty} Packets</p>
            </div>
            <p className="text-[8px] text-slate-500 font-medium mt-1">Total Packets Sent</p>
          </div>

          {/* Total Replaced */}
          <div className="bg-slate-900/90 border border-cyan-900/50 rounded-2xl p-3 shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-cyan-400 uppercase font-semibold">Total Replaced</p>
              <p className="text-sm sm:text-base font-bold text-cyan-300 mt-0.5">{summary.totalReplacedQty || 0} Packets</p>
            </div>
            <p className="text-[8px] text-cyan-500 font-medium mt-1">1-to-1 Swaps</p>
          </div>
        </div>

        {/* Historical Chart */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
          <h3 className="font-bold text-white text-xs">Dispatch Sales History</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesGraph}>
                <defs>
                  <linearGradient id="shopSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#059669', borderRadius: '10px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#shopSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shop Account Mobile Ledger */}
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Account Ledger
            </h3>
            <button
              onClick={() => openPaymentModal(summary.pendingPayment, 'Account Ledger Settlement')}
              className="text-[9px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-lg font-bold flex items-center gap-1 hover:bg-emerald-900 transition-colors"
            >
              <Banknote className="w-3 h-3 text-emerald-400" /> + Record Payment
            </button>
          </div>

          <div className="space-y-2.5">
            {ledger.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-3 text-center">No ledger entries yet.</p>
            ) : (
              ledger.map((entry: any, idx: number) => {
                const isDelivery = entry.type === 'delivery';
                const isReturn = entry.type === 'return';
                const isReplacement = entry.type === 'replacement' || entry.returnType === 'replacement';
                const isPayment = entry.type === 'payment';

                const totalAmount = entry.netAmount || entry.debit || 0;
                const paidAmount = entry.amountPaid || 0;
                const unpaidDue = isDelivery ? Math.max(0, totalAmount - paidAmount) : 0;
                const isPaid = isDelivery ? unpaidDue <= 0 || entry.paymentStatus === 'paid' : true;

                return (
                  <div key={idx} className="bg-slate-800/70 border border-emerald-900/40 rounded-xl p-3 text-xs space-y-2 shadow-sm">
                    {/* Header: Reference + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-900/20 pb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-bold text-white text-[11px] font-mono truncate shrink-0">{entry.reference}</span>
                        <span className="text-[10px] text-slate-400 truncate">({entry.date})</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                            isDelivery
                              ? isPaid
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : isPayment
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : isReplacement
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          }`}
                        >
                          {isDelivery
                            ? isPaid
                              ? '✓ Paid'
                              : `Unpaid (Due ₹${unpaidDue})`
                            : isReplacement
                            ? '⇄ Replacement'
                            : isReturn
                            ? '↩ Return'
                            : entry.type}
                        </span>

                        {/* Action buttons for Delivery */}
                        {isDelivery && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-700/50 shrink-0">
                            <button
                              onClick={() => openEditOrderModal(entry)}
                              title="Edit Dispatch Order"
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(entry._id || entry.id)}
                              title="Delete Dispatch Order"
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Action buttons for Return & Replacement */}
                        {(isReturn || isReplacement) && (
                          <div className="flex items-center gap-1 pl-1 border-l border-slate-700/50 shrink-0">
                            <button
                              onClick={() => openEditReturnModal(entry)}
                              title={isReplacement ? 'Edit Replacement Record' : 'Edit Return Record'}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReturn(entry._id || entry.id)}
                              title={isReplacement ? 'Delete Replacement Record' : 'Delete Return Record'}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="text-[11px] text-slate-200 font-medium break-words">
                      {entry.description}
                    </div>

                    {/* Unified Delivery & Payment Info in Same Card */}
                    {isDelivery && (
                      <div className="bg-slate-900/80 border border-slate-700/40 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] mt-1">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Total Order:</span>
                            <span className="font-bold text-white">₹{totalAmount}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400">Paid:</span>
                            <span className="font-bold text-emerald-400">₹{paidAmount}</span>
                            {unpaidDue > 0 && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span className="text-amber-400 font-bold">Due: ₹{unpaidDue}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Button: Mark as Paid manually by sender */}
                        {unpaidDue > 0 ? (
                          <button
                            onClick={() => openPaymentModalForDelivery(entry)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-amber-900/30 transition-all active:scale-95 shrink-0"
                          >
                            <Banknote className="w-3.5 h-3.5 shrink-0" /> Mark as Paid (₹{unpaidDue})
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800/40 text-[10px] shrink-0">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" /> Fully Settled
                          </div>
                        )}
                      </div>
                    )}

                    {/* Non-delivery (Standalone payment, return, or replacement) */}
                    {!isDelivery && (
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-emerald-900/20">
                        <span className="text-slate-400">
                          {isReplacement ? 'Financial Impact' : 'Amount Settled'}
                        </span>
                        <span className={`font-bold ${isReplacement ? 'text-cyan-300' : 'text-emerald-300'}`}>
                          {isReplacement ? '₹0 (1-to-1 Packet Exchange)' : `₹${entry.credit}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal: New Order */}
        {orderModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0">
            <div className="bg-slate-900 border-t border-emerald-900/60 rounded-t-3xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold text-emerald-400">Dispatch Order</h3>
                <button onClick={() => setOrderModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Sprout Packet Type</label>
                  <select
                    value={sproutType}
                    onChange={(e) => setSproutType(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Moong Sprouts">Moong Sprouts</option>
                    <option value="Chana Sprouts">Chana Sprouts</option>
                    <option value="Mixed Sprouts">Mixed Sprouts</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Quantity (Pkts)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={orderQty}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setOrderQty(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Rate (₹/Pkt)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={orderRate}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setOrderQtyRate(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                    Cash Collected Now (₹) <span className="text-amber-400 font-normal">(Leave 0 if Pay Later)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountPaid}
                    onKeyDown={allowOnlyDecimalKeys}
                    onChange={(e) => {
                      const clean = sanitizeDecimal(e.target.value);
                      setAmountPaid(clean === '' ? ('' as any) : Number(clean));
                    }}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Dispatch Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Payment (Later Paid) */}
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-emerald-900/60 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" /> Record Payment in Account Ledger
                </h3>
                <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Payment Amount (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paymentAmount}
                    onKeyDown={allowOnlyDecimalKeys}
                    onChange={(e) => {
                      const clean = sanitizeDecimal(e.target.value);
                      setPaymentAmount(clean === '' ? ('' as any) : Number(clean));
                    }}
                    placeholder="Enter collected amount"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                  {summary.pendingPayment > 0 && (
                    <p className="text-[9px] text-amber-400 mt-1 font-medium">
                      Current Pending Balance: ₹{summary.pendingPayment.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / PhonePe / Paytm</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Transaction Ref / Txn ID</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI-9812345 or Cash receipt #"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Notes / Reference</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Later paid settlement for dispatch"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save to Account Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Packet Replacement */}
        {returnModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0">
            <div className="bg-slate-900 border-t border-emerald-900/60 rounded-t-3xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Record Packet Replacement
                </h3>
                <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReturnOrder} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Sprout Packet Type</label>
                  <select
                    value={returnSproutType}
                    onChange={(e) => setReturnSproutType(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Moong Sprouts">Moong Sprouts</option>
                    <option value="Chana Sprouts">Chana Sprouts</option>
                    <option value="Mixed Sprouts">Mixed Sprouts</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Replaced Packets
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={returnQty}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setReturnQty(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Unit Rate Ref (₹/Pkt)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={returnRate}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setReturnRate(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                  <p className="text-[9px] text-cyan-400 mt-1">
                    * Replacements swap expired packets with fresh packets (1-for-1). Outstanding balance remains unchanged.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Record Replacement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Packet Replacement */}
        {editReturnModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-emerald-900/60 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-cyan-400">
                  <Pencil className="w-4 h-4" />
                  Edit Packet Replacement
                </h3>
                <button onClick={() => setEditReturnModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateReturn} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Sprout Packet Type</label>
                  <select
                    value={editReturnSproutType}
                    onChange={(e) => setEditReturnSproutType(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Moong Sprouts">Moong Sprouts</option>
                    <option value="Chana Sprouts">Chana Sprouts</option>
                    <option value="Mixed Sprouts">Mixed Sprouts</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Replaced Packets
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editReturnQty}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setEditReturnQty(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Rate (₹/Pkt)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editReturnRate}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setEditReturnRate(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={editReturnReason}
                    onChange={(e) => setEditReturnReason(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                  <p className="text-[9px] text-cyan-400 mt-1">
                    1-to-1 Packet Exchange: No impact on outstanding payment balance.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setEditReturnModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Update Replacement Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Dispatch Order */}
        {editOrderModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-emerald-900/60 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-emerald-400" /> Edit Dispatch Order
                </h3>
                <button onClick={() => setEditOrderModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateOrder} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Sprout Packet Type</label>
                  <select
                    value={editSproutType}
                    onChange={(e) => setEditSproutType(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Moong Sprouts">Moong Sprouts</option>
                    <option value="Chana Sprouts">Chana Sprouts</option>
                    <option value="Mixed Sprouts">Mixed Sprouts</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Quantity (Pkts)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editOrderQty}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setEditOrderQty(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Rate (₹/Pkt)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editOrderRate}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setEditOrderRate(clean === '' ? ('' as any) : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                    Amount Paid / Cash Collected (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editAmountPaid}
                    onKeyDown={allowOnlyDecimalKeys}
                    onChange={(e) => {
                      const clean = sanitizeDecimal(e.target.value);
                      setEditAmountPaid(clean === '' ? ('' as any) : Number(clean));
                    }}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white font-bold"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Total Order Value: ₹{(Number(editOrderQty) || 0) * (Number(editOrderRate) || 0)}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setEditOrderModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Update Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
