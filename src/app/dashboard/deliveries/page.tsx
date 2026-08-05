'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { deliveriesAPI, shopsAPI } from '@/services/api';
import { Delivery, Shop } from '@/types';
import { Truck, Plus, FileText, Check, X, Printer, IndianRupee, Store, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys, sanitizeInteger, sanitizeDecimal } from '@/utils/inputValidation';
import { formatDateIST } from '@/utils/dateUtils';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceModalDelivery, setInvoiceModalDelivery] = useState<Delivery | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Delivery Form State
  const [selectedShopId, setSelectedShopId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [deliveryPerson, setDeliveryPerson] = useState('Raju (Driver)');
  const [items, setItems] = useState([
    { sproutType: 'Moong Sprouts', quantity: 5, rate: 20, unit: 'packets' },
  ]);

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, shopRes] = await Promise.all([deliveriesAPI.getAll(), shopsAPI.getAll()]);
      if (delRes.success) setDeliveries(delRes.data || []);
      if (shopRes.success) setShops(shopRes.data || []);

      if (delRes.isFallback || shopRes.isFallback) {
        showWarning('Server offline. Displaying cached deliveries and shops.');
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

  const addItemRow = () => {
    setItems([...items, { sproutType: 'Chana Sprouts', quantity: 20, rate: 20, unit: 'packets' }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const netAmount = Math.max(0, subTotal - Number(discount || 0));

  const handleDeleteDelivery = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery dispatch record?')) return;
    try {
      const res = await deliveriesAPI.delete(id);
      if (res.success) {
        showSuccess('Delivery record deleted successfully.');
        loadData();
      } else {
        showError(res.message || 'Failed to delete delivery.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting delivery.');
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return showError('Please select a retail shop partner.');

    setIsSubmitting(true);
    try {
      const payload = {
        shopId: selectedShopId,
        items,
        discount: Number(discount),
        amountPaid: Number(amountPaid),
        deliveryPerson,
      };

      const res = await deliveriesAPI.create(payload);
      if (res.success) {
        if (res.isFallback) {
          showWarning(res.message || 'Delivery saved locally (Offline mode).');
        } else {
          showSuccess('Delivery dispatched! Dues and stock updated successfully.');
        }
        setModalOpen(false);
        loadData();
      } else {
        showError(res.message || 'Failed to dispatch delivery.');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while dispatching delivery.');
    } finally {
      setIsSubmitting(false);
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
              <Truck className="w-7 h-7 text-emerald-400 shrink-0" />
              Daily Sprouts Deliveries & Invoices
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dispatch orders to retail shops, generate bills, track payment statuses and outstanding balances.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Dispatch</span>
          </button>
        </div>

        {/* Deliveries Table */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-4">Delivery</th>
                  <th className="p-4">Shop</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4">Net Amount</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading delivery records...
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No delivery dispatches recorded yet.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => (
                    <tr key={del._id} className="hover:bg-emerald-900/10 transition-colors">
                      <td className="p-4 font-bold text-emerald-300">{del.deliveryNumber}</td>
                      <td className="p-4 text-white font-semibold flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{del.shopName}</span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {formatDateIST(del.deliveryDate || del.createdAt)}
                      </td>
                      <td className="p-4 font-bold text-white">₹{del.netAmount}</td>
                      <td className="p-4 text-slate-300">₹{del.amountPaid || 0}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            del.paymentStatus === 'paid'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                              : del.paymentStatus === 'partial'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                              : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {del.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        <button
                          onClick={() => setInvoiceModalDelivery(del)}
                          className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDelivery(del._id)}
                          title="Delete Delivery Dispatch"
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-900/50 rounded-lg border border-rose-900/30 transition-colors hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create Delivery */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-emerald-900/60 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" /> Dispatch New Sprouts Delivery
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDelivery} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Select Retail Shop</label>
                    <select
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2.5 text-xs text-white"
                      required
                    >
                      <option value="">Select Shop Partner</option>
                      {shops.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.shopName} (Dues: ₹{s.outstandingBalance})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Delivery Executive</label>
                    <input
                      type="text"
                      value={deliveryPerson}
                      onChange={(e) => setDeliveryPerson(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Items Builder */}
                <div className="space-y-2.5 border-t border-b border-emerald-900/40 py-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-emerald-400">Delivery Sprouts Items</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Sprouts Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/60 border border-emerald-900/30 rounded-xl p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                      {/* Sprout Type */}
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.sproutType}
                          onChange={(e) => updateItem(idx, 'sproutType', e.target.value)}
                          className="w-full bg-slate-900 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white font-medium"
                        >
                          <option value="Moong Sprouts">Moong Sprouts</option>
                          <option value="Chana Sprouts">Chana Sprouts</option>
                          <option value="Mixed Sprouts">Mixed Sprouts</option>
                          <option value="Horse Gram Sprouts">Horse Gram Sprouts</option>
                        </select>
                      </div>

                      {/* Qty, Rate, Total Grid on Mobile, Flex on Desktop */}
                      <div className="grid grid-cols-3 sm:flex items-center gap-2 flex-1">
                        <div>
                          <label className="text-[10px] text-slate-400 block sm:hidden mb-0.5">Qty</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onKeyDown={allowOnlyNumbersKeys}
                            onChange={(e) => {
                              const clean = sanitizeInteger(e.target.value);
                              updateItem(idx, 'quantity', clean === '' ? '' : Number(clean));
                            }}
                            placeholder="Qty"
                            className="w-full sm:w-20 bg-slate-900 border border-emerald-900/40 rounded-xl px-2.5 py-2 text-xs text-white font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block sm:hidden mb-0.5">Rate ₹</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.rate}
                            onKeyDown={allowOnlyDecimalKeys}
                            onChange={(e) => {
                              const clean = sanitizeDecimal(e.target.value);
                              updateItem(idx, 'rate', clean === '' ? '' : Number(clean));
                            }}
                            placeholder="Rate ₹"
                            className="w-full sm:w-20 bg-slate-900 border border-emerald-900/40 rounded-xl px-2.5 py-2 text-xs text-white font-semibold"
                          />
                        </div>

                        <div className="text-right sm:w-24">
                          <label className="text-[10px] text-slate-400 block sm:hidden mb-0.5">Total</label>
                          <div className="text-xs font-bold text-emerald-300 py-1.5 sm:py-0">
                            ₹{(Number(item.quantity) || 0) * (Number(item.rate) || 0)}
                          </div>
                        </div>
                      </div>

                      {items.length > 1 && (
                        <div className="flex justify-end sm:block border-t sm:border-t-0 border-slate-700/30 pt-1.5 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-xl shrink-0 flex items-center gap-1 text-[11px] sm:text-xs"
                          >
                            <X className="w-4 h-4" />
                            <span className="sm:hidden text-rose-300 font-semibold">Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calculation Summary */}
                <div className="bg-slate-800/60 p-3.5 sm:p-4 rounded-xl space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">₹{subTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount (₹):</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discount}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setDiscount(clean === '' ? 0 : Number(clean));
                      }}
                      className="w-24 sm:w-28 bg-slate-900 border border-emerald-900/40 rounded-lg px-2.5 py-1.5 text-right text-xs text-white font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-400 text-sm pt-2 border-t border-emerald-900/40">
                    <span>Net Bill Amount:</span>
                    <span>₹{netAmount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-900/20">
                    <span className="text-emerald-300 font-semibold">Cash Collected Now (₹):</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountPaid}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setAmountPaid(clean === '' ? 0 : Number(clean));
                      }}
                      placeholder="0"
                      className="w-24 sm:w-28 bg-slate-900 border border-emerald-900/40 rounded-lg px-2.5 py-1.5 text-right text-xs text-emerald-300 font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-amber-400 font-semibold">
                    <span>Remaining Balance Due (₹):</span>
                    <span>₹{Math.max(0, netAmount - Number(amountPaid || 0))}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                    Dispatch & Save Delivery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoice View Modal */}
        {invoiceModalDelivery && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-emerald-900/80 rounded-t-3xl sm:rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-emerald-400">MamaFarm Organic Sprouts</h3>
                  <p className="text-xs text-slate-400">Tax Invoice & Delivery Receipt</p>
                </div>
                <button onClick={() => setInvoiceModalDelivery(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 text-xs gap-3 sm:gap-4 text-slate-300 bg-slate-800/40 p-3.5 rounded-xl border border-emerald-900/30">
                <div>
                  <p className="font-bold text-white mb-1">Customer / Shop:</p>
                  <p className="text-emerald-300 font-semibold">{invoiceModalDelivery.shopName}</p>
                  <p>Invoice #: {invoiceModalDelivery.deliveryNumber}</p>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Delivery Details:</p>
                  <p>
                    Date: {formatDateIST(invoiceModalDelivery.deliveryDate || invoiceModalDelivery.createdAt)}
                  </p>
                  <p>Driver: {invoiceModalDelivery.deliveryPerson || 'Self'}</p>
                </div>
              </div>

              <div className="border border-emerald-900/40 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 min-w-[280px]">
                  <thead className="bg-slate-800 text-emerald-400">
                    <tr>
                      <th className="p-2.5 sm:p-3">Sprout Item</th>
                      <th className="p-2.5 sm:p-3">Qty</th>
                      <th className="p-2.5 sm:p-3">Rate</th>
                      <th className="p-2.5 sm:p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoiceModalDelivery.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 sm:p-3 text-white font-medium">{it.sproutType}</td>
                        <td className="p-2.5 sm:p-3">{it.quantity} {it.unit}</td>
                        <td className="p-2.5 sm:p-3">₹{it.rate}</td>
                        <td className="p-2.5 sm:p-3 text-right font-semibold text-white">₹{it.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-sm font-bold bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-800/50 text-white">
                <span>Total Amount Payable:</span>
                <span className="text-emerald-400 text-base sm:text-lg">₹{invoiceModalDelivery.netAmount}</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-emerald-900/40 gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Print / Export PDF</span><span className="sm:hidden">Print</span>
                </button>
                <button
                  onClick={() => setInvoiceModalDelivery(null)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
