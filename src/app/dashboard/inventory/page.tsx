'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { inventoryAPI } from '@/services/api';
import { InventoryItem } from '@/types';
import { Boxes, AlertTriangle, ShieldCheck, Search, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys, sanitizeInteger, sanitizeDecimal } from '@/utils/inputValidation';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [type, setType] = useState('raw_material');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState(10);
  const [valuationPerUnit, setValuationPerUnit] = useState(0);

  const { showSuccess, showError } = useToast();

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll();
      if (res.success) {
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : raw?.items || [];
        const normalized: InventoryItem[] = list.map((item: any) => ({
          _id: item._id || item.id || `INV-${Math.random().toString(36).substring(2, 7)}`,
          itemName: item.itemName || item.name || 'Stock Item',
          type: item.type || item.category || 'raw_material',
          quantity: Number(item.quantity) || 0,
          unit: item.unit || 'kg',
          minThreshold: Number(item.minThreshold ?? item.minAlert ?? 10),
          valuationPerUnit: Number(item.valuationPerUnit ?? item.pricePerUnit ?? 0),
        }));
        setInventory(normalized);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return showError('Please specify item name.');

    setIsSubmitting(true);
    try {
      const res = await inventoryAPI.create({
        itemName,
        type: type as any,
        quantity: Number(quantity),
        unit,
        minThreshold: Number(minThreshold),
        valuationPerUnit: Number(valuationPerUnit),
      });

      if (res.success) {
        showSuccess('New stock item added to matrix!');
        setModalOpen(false);
        setItemName('');
        setQuantity(0);
        setValuationPerUnit(0);
        loadInventory();
      } else {
        showError(res.message || 'Failed to create stock item.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while adding stock item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;
    try {
      const res = await inventoryAPI.delete(id);
      if (res.success) {
        showSuccess(`Removed "${name}" from inventory.`);
        loadInventory();
      } else {
        showError(res.message || 'Failed to delete item.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting inventory item.');
    }
  };

  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const totalValuation = safeInventory.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.valuationPerUnit) || 0),
    0
  );
  const lowStockCount = safeInventory.filter(
    (item) => (Number(item?.quantity) || 0) <= (Number(item?.minThreshold) || 10)
  ).length;

  const filtered = safeInventory.filter(
    (item) =>
      (item?.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item?.type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Boxes className="w-7 h-7 text-emerald-400 shrink-0" />
              Real-time Inventory & Stock Matrix
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live tracking of raw beans, packaged sprouts, packaging pouches, low stock alerts and stock valuation.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Stock SKU</span>
          </button>
        </div>

        {/* Overview KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium mb-1">Total Stock Valuation</p>
            <p className="text-2xl font-bold text-emerald-400">₹{totalValuation.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-1">Calculated from unit buy/procurement rates</p>
          </div>

          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium mb-1">Total Stock SKUs</p>
            <p className="text-2xl font-bold text-white">{safeInventory.length} Items</p>
            <p className="text-xs text-emerald-400 mt-1 font-medium">Raw, Finished & Packaging</p>
          </div>

          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 font-medium mb-1">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-amber-400">{lowStockCount} Items</p>
            <p className="text-xs text-amber-300 mt-1 font-medium">Requires replenishment</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search stock by item name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-emerald-900/40 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category Type</th>
                  <th className="p-4">Quantity In Hand</th>
                  <th className="p-4">Min Safety Alert</th>
                  <th className="p-4">Valuation / Unit</th>
                  <th className="p-4">Total Stock Value</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Loading inventory levels...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No stock items found in matrix.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow = (Number(item?.quantity) || 0) <= (Number(item?.minThreshold) || 10);
                    const stockVal = (Number(item?.quantity) || 0) * (Number(item?.valuationPerUnit) || 0);
                    return (
                      <tr key={item._id} className="hover:bg-emerald-900/10 transition-colors">
                        <td className="p-4 font-bold text-white">{item.itemName}</td>
                        <td className="p-4 uppercase text-slate-400 text-[10px] font-semibold">{item.type}</td>
                        <td className="p-4 font-bold text-emerald-300 text-sm">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-4 text-slate-400">
                          {item.minThreshold} {item.unit}
                        </td>
                        <td className="p-4 text-slate-300">₹{item.valuationPerUnit || 0}</td>
                        <td className="p-4 font-bold text-white">₹{stockVal.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max ${
                              isLow
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isLow ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-400" /> Low Stock
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Healthy
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDeleteItem(item._id, item.itemName)}
                            title="Delete Stock Item"
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-900/50 rounded-lg border border-rose-900/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create Stock Item */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Boxes className="w-5 h-5" /> Add Stock Matrix Item
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStock} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 mb-1 block">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Moong Grain / Sprout Pouches"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Category Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="raw_material">Raw Material</option>
                      <option value="finished_sprout">Finished Sprout</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Measurement Unit</label>
                    <input
                      type="text"
                      placeholder="kg / packets / pcs"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Quantity</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quantity}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setQuantity(clean === '' ? 0 : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Min Alert</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minThreshold}
                      onKeyDown={allowOnlyNumbersKeys}
                      onChange={(e) => {
                        const clean = sanitizeInteger(e.target.value);
                        setMinThreshold(clean === '' ? 0 : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Valuation (₹)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={valuationPerUnit}
                      onKeyDown={allowOnlyDecimalKeys}
                      onChange={(e) => {
                        const clean = sanitizeDecimal(e.target.value);
                        setValuationPerUnit(clean === '' ? 0 : Number(clean));
                      }}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Stock SKU</span>
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
