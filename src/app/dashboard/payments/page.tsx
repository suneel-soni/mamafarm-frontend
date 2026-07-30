'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { paymentsAPI, shopsAPI, suppliersAPI } from '@/services/api';
import { Payment, Shop, Supplier } from '@/types';
import { CreditCard, Plus, Check, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { allowOnlyDecimalKeys, sanitizeDecimal } from '@/utils/inputValidation';
import { formatDateIST } from '@/utils/dateUtils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [entityType, setEntityType] = useState<'shop' | 'supplier'>('shop');
  const [shopId, setShopId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [transactionRef, setTransactionRef] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, shopRes, supRes] = await Promise.all([
        paymentsAPI.getAll(),
        shopsAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      if (payRes.success) setPayments(payRes.data || []);
      if (shopRes.success) setShops(shopRes.data || []);
      if (supRes.success) setSuppliers(supRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Enter valid payment amount.');

    try {
      const payload = {
        entityType,
        shopId: entityType === 'shop' ? shopId : undefined,
        supplierId: entityType === 'supplier' ? supplierId : undefined,
        amount,
        paymentMethod,
        transactionRef,
      };

      const res = await paymentsAPI.create(payload);
      if (res.success) {
        setToast(`Payment ${res.data.paymentNumber} recorded & balance adjusted automatically!`);
        setModalOpen(false);
        setAmount(0);
        setTransactionRef('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <Check className="w-5 h-5" />
            <span className="text-xs font-semibold">{toast}</span>
            <button onClick={() => setToast(null)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-emerald-400 shrink-0" />
              Payments & Financial Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Record cash/UPI/bank receipts from shops, supplier payouts, and automatic balance adjustments.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment Entry</span>
          </button>
        </div>

        {/* Payments Table */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-4">Payment #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Party Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Ref / Txn ID</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading payments ledger...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isIncoming = p.entityType === 'shop';
                    return (
                      <tr key={p._id} className="hover:bg-emerald-900/10 transition-colors">
                        <td className="p-4 font-bold text-emerald-300">{p.paymentNumber}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max ${
                              isIncoming
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                                : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                            }`}
                          >
                            {isIncoming ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Collection
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3 text-rose-400" /> Payout
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">{p.partyName || 'Partner Party'}</td>
                        <td className="p-4 font-bold text-white">₹{p.amount}</td>
                        <td className="p-4 uppercase text-slate-300">{p.paymentMethod}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">{p.transactionRef || 'N/A'}</td>
                        <td className="p-4 text-slate-400">
                          {formatDateIST(p.paymentDate || p.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Record Payment Entry
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Entity Type</label>
                    <select
                      value={entityType}
                      onChange={(e: any) => setEntityType(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="shop">Customer Shop (Incoming Receipt)</option>
                      <option value="supplier">Supplier (Outgoing Payout)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Select {entityType === 'shop' ? 'Shop' : 'Supplier'}
                    </label>
                    {entityType === 'shop' ? (
                      <select
                        value={shopId}
                        onChange={(e) => setShopId(e.target.value)}
                        className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      >
                        <option value="">Select Shop</option>
                        {shops.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.shopName} (Dues: ₹{s.outstandingBalance})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((sup) => (
                          <option key={sup._id} value={sup._id}>
                            {sup.name} (Dues: ₹{sup.pendingPayment})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Amount (₹)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setAmount(clean === '' ? 0 : Number(clean));
                      }}
                      placeholder="1000"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="upi">UPI / PhonePe / Paytm</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Transaction Ref / Note</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/9812345/REF001"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40"
                  >
                    Submit & Adjust Balance
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
