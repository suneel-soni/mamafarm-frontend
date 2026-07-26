'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { materialsAPI, suppliersAPI } from '@/services/api';
import { MaterialGroupedSummary, Supplier } from '@/types';
import { Wheat, Plus, Calendar, Filter, X, Check, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys } from '@/utils/inputValidation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const materialSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category: z.enum(['Raw Bean', 'Packaging', 'Chemicals/Cleaning', 'Other']),
  supplier: z.string().optional(),
  quantity: z.number().min(1, 'Min 1'),
  unit: z.string().min(1, 'Unit required'),
  purchasePrice: z.number().min(0, 'Min 0'),
  gstPercent: z.number().optional().default(0),
  invoiceNumber: z.string().optional(),
  paymentStatus: z.enum(['paid', 'pending', 'partial']).default('paid'),
  purchaseDate: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

export default function MaterialSummaryPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal & Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      category: 'Raw Bean',
      unit: 'kg',
      paymentStatus: 'paid',
    },
  });

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await materialsAPI.getSummary({ filter, startDate, endDate });
      if (res.success) {
        setSummaryData(res.data);
        if (res.isFallback) showWarning('Server offline. Displaying cached materials.');
      } else {
        showError(res.message || 'Failed to load material summary.');
      }
    } catch (err: any) {
      showError(err.message || 'Error loading material summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [filter, startDate, endDate]);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await suppliersAPI.getAll();
        if (res.success) setSuppliers(res.data || []);
      } catch (err: any) {
        showError(err.message || 'Failed to load suppliers.');
      }
    }
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingMaterial(null);
    reset({
      name: '',
      category: 'Raw Bean',
      supplier: '',
      quantity: 50,
      unit: 'kg',
      purchasePrice: 95,
      invoiceNumber: '',
      paymentStatus: 'paid',
    });
    setModalOpen(true);
  };

  const openEditModal = (mat: any) => {
    setEditingMaterial(mat);
    setValue('name', mat.name || '');
    setValue('category', mat.category || 'Raw Bean');
    setValue('supplier', typeof mat.supplier === 'object' ? mat.supplier?._id : mat.supplier || '');
    setValue('quantity', mat.quantity || 0);
    setValue('unit', mat.unit || 'kg');
    setValue('purchasePrice', mat.purchasePrice || 0);
    setValue('invoiceNumber', mat.invoiceNumber || '');
    setValue('paymentStatus', mat.paymentStatus || 'paid');
    setModalOpen(true);
  };

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        const res = await materialsAPI.update(editingMaterial._id, data);
        if (res.success) {
          if (res.isFallback) showWarning(res.message || `Updated ${data.name} locally.`);
          else showSuccess(`Updated ${data.name} purchase record!`);
          setModalOpen(false);
          setEditingMaterial(null);
          loadSummary();
        } else {
          showError(res.message || 'Failed to update material purchase.');
        }
      } else {
        const res = await materialsAPI.create(data);
        if (res.success) {
          if (res.isFallback) showWarning(res.message || `Added ${data.name} locally.`);
          else showSuccess(`Recorded purchase of ${data.quantity} ${data.unit} ${data.name}!`);
          setModalOpen(false);
          reset();
          loadSummary();
        } else {
          showError(res.message || 'Failed to record material purchase.');
        }
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete material purchase "${name}"?`)) return;
    try {
      const res = await materialsAPI.delete(id);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || `Deleted ${name} locally.`);
        else showSuccess(`Deleted ${name} purchase record.`);
        loadSummary();
      } else {
        showError(res.message || 'Failed to delete material purchase.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting material purchase.');
    }
  };

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

        {/* Mobile Title & Action */}
        <div className="bg-slate-900 border border-emerald-900/40 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Wheat className="w-5 h-5 text-emerald-400" />
              Material Purchases
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Raw grain & pouch summary</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Horizontal Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-900 border border-emerald-900/30 text-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[9px] text-slate-400 uppercase font-semibold">Total Cost</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              ₹{(summaryData?.totalPurchaseCost || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3 shadow-md">
            <p className="text-[9px] text-slate-400 uppercase font-semibold">Total Purchases</p>
            <p className="text-base font-bold text-white mt-0.5">{summaryData?.numberOfPurchases || 0} Orders</p>
          </div>
        </div>

        {/* Date-Wise Grouped Purchase List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading material purchases...</div>
          ) : !summaryData || !summaryData.groupedSummary || summaryData.groupedSummary.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No material purchases in this period.</div>
          ) : (
            summaryData.groupedSummary.map((group: any, idx: number) => (
              <div key={idx} className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md space-y-2">
                <div className="flex justify-between items-center border-b border-emerald-900/30 pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {group.date}
                  </span>
                  <span className="text-xs font-extrabold text-amber-300">
                    ₹{group.totalCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {group.materials.map((mat: any) => (
                    <div key={mat._id} className="bg-slate-800/60 border border-emerald-900/30 rounded-xl p-2.5 text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-xs">{mat.name}</p>
                            <button
                              onClick={() => openEditModal(mat)}
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 rounded-lg transition-all"
                              title="Edit Material Purchase"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(mat._id, mat.name)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded-lg transition-all"
                              title="Delete Material Purchase"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Supplier: {typeof mat.supplier === 'object' ? mat.supplier?.name : 'Local Trade'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-900 text-emerald-300 rounded-md font-bold text-[10px]">
                          {mat.quantity} {mat.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-emerald-900/20">
                        <span>Rate: ₹{mat.purchasePrice}/{mat.unit}</span>
                        <span className="font-bold text-emerald-400">
                          Total: ₹{Math.round(mat.quantity * mat.purchasePrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add or Edit Purchase */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0">
            <div className="bg-slate-900 border-t border-emerald-900/60 rounded-t-3xl w-full max-w-md p-5 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h3 className="text-xs font-bold text-emerald-400">
                  {editingMaterial ? 'Edit Grain or Packaging Purchase' : 'Record Grain or Packaging Purchase'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Item Name</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Green Moong Grain (50kg Bag)"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                  {errors.name && <p className="text-[10px] text-rose-400 mt-0.5">{String(errors.name?.message)}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Category</label>
                    <select
                      {...register('category')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Raw Bean">Raw Bean</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Chemicals/Cleaning">Cleaning</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Supplier</label>
                    <select
                      {...register('supplier')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Qty</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      onKeyDown={allowOnlyDecimalKeys}
                      {...register('quantity', { valueAsNumber: true })}
                      placeholder="100"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Unit</label>
                    <input
                      {...register('unit')}
                      placeholder="kg"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">Price (₹)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      onKeyDown={allowOnlyDecimalKeys}
                      {...register('purchasePrice', { valueAsNumber: true })}
                      placeholder="90"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingMaterial ? 'Update Purchase' : 'Save Purchase'}
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
