'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { productionAPI, materialsAPI } from '@/services/api';
import { ProductionBatch, Material } from '@/types';
import { Factory, Plus, Check, X, Flame, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys } from '@/utils/inputValidation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productionSchema = z.object({
  rawMaterialName: z.string().min(2, 'Raw material is required'),
  rawMaterialQty: z.number().min(1, 'Quantity consumed required'),
  unit: z.string().default('kg'),
  sproutType: z.string().min(2, 'Sprout type required'),
  sproutsProducedQty: z.number().min(1, 'Produced output required'),
  sproutsUnit: z.string().default('packets'),
  wasteQty: z.number().default(0),
  notes: z.string().optional(),
});

type ProductionFormData = z.infer<typeof productionSchema>;

export default function ProductionPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<any>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      unit: 'kg',
      sproutsUnit: 'packets',
      wasteQty: 1,
    },
  });

  const watchRawQty = watch('rawMaterialQty') || 0;
  const watchWaste = watch('wasteQty') || 0;
  const estimatedLoss = watchRawQty > 0 ? ((watchWaste / watchRawQty) * 100).toFixed(1) : '0';

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, matRes] = await Promise.all([productionAPI.getAll(), materialsAPI.getAll()]);
      if (batchRes.success) setBatches(batchRes.data || []);
      if (matRes.success) setMaterials(matRes.data || []);

      if (batchRes.isFallback || matRes.isFallback) {
        showWarning('Server offline. Displaying cached production batches.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load production data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: ProductionFormData) => {
    setIsSubmitting(true);
    try {
      const res = await productionAPI.create(data);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Batch logged locally (Offline mode).');
        else showSuccess('Batch logged! Raw material consumed and sprouts stock updated.');
        setModalOpen(false);
        reset();
        loadData();
      } else {
        showError(res.message || 'Failed to log production batch.');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while logging batch.');
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Factory className="w-7 h-7 text-emerald-400" />
              Sprouting Production Batches
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track raw bean germination, output yields, waste %, and automatic inventory updates.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Log Sprouting Batch</span>
          </button>
        </div>

        {/* Batches Table */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-4">Batch #</th>
                  <th className="p-4">Raw Material Consumed</th>
                  <th className="p-4">Sprout Produced Yield</th>
                  <th className="p-4">Waste / Loss</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Completion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading production batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No production batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b._id} className="hover:bg-emerald-900/10 transition-colors">
                      <td className="p-4 font-bold text-emerald-300">{b.batchNumber}</td>
                      <td className="p-4 text-white">
                        {b.rawMaterialQty} {b.unit} of {b.rawMaterialName}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {b.sproutsProducedQty} {b.sproutsUnit} {b.sproutType}
                      </td>
                      <td className="p-4 text-amber-300 font-semibold">
                        {b.wasteQty} {b.unit} ({b.lossPercent}%)
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(b.completionDate || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
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
                  <Factory className="w-5 h-5" /> Log New Sprouting Cycle
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Raw Material Used</label>
                  <select
                    {...register('rawMaterialName')}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Raw Bean</option>
                    {materials.map((m) => (
                      <option key={m._id} value={m.name}>
                        {m.name} ({m.quantity} {m.unit} in stock)
                      </option>
                    ))}
                    <option value="Raw Green Moong Grain">Raw Green Moong Grain</option>
                    <option value="Desi Brown Chana Grain">Desi Brown Chana Grain</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Raw Consumed Qty (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      onKeyDown={allowOnlyDecimalKeys}
                      {...register('rawMaterialQty', { valueAsNumber: true })}
                      placeholder="50"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Waste / Ungerminated (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      onKeyDown={allowOnlyDecimalKeys}
                      {...register('wasteQty', { valueAsNumber: true })}
                      placeholder="1.2"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex justify-between items-center">
                  <span>Estimated Germination Loss:</span>
                  <span className="font-bold text-emerald-400">{estimatedLoss}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Sprout Product Yield</label>
                    <select
                      {...register('sproutType')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Moong Sprouts">Moong Sprouts</option>
                      <option value="Chana Sprouts">Chana Sprouts</option>
                      <option value="Mixed Sprouts">Mixed Sprouts</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Output Produced (Packets)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      onKeyDown={allowOnlyNumbersKeys}
                      {...register('sproutsProducedQty', { valueAsNumber: true })}
                      placeholder="500"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Production Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Batch quality, soaking duration..."
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
                    Log Batch & Update Stock
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
