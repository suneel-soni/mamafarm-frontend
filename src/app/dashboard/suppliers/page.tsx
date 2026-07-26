'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { suppliersAPI } from '@/services/api';
import { Supplier } from '@/types';
import { Users, Plus, Search, Check, X, Phone, Mail, Building, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name required'),
  contactPerson: z.string().optional(),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await suppliersAPI.getAll();
      if (res.success) {
        setSuppliers(res.data || []);
        if (res.isFallback) showWarning('Server offline. Showing cached suppliers.');
      } else {
        showError(res.message || 'Failed to load suppliers.');
      }
    } catch (err: any) {
      showError(err.message || 'Unexpected error loading suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      const res = await suppliersAPI.create(data);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || `Supplier ${data.name} saved locally.`);
        else showSuccess(`Supplier ${data.name} registered!`);
        setModalOpen(false);
        reset();
        loadSuppliers();
      } else {
        showError(res.message || 'Failed to create supplier.');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while saving supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson || '').toLowerCase().includes(search.toLowerCase())
  );

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
              <Users className="w-7 h-7 text-emerald-400" />
              Raw Material & Packaging Suppliers
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Maintain pulse traders, pouch manufacturers, contact info, total orders & pending payments.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supplier name or contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-emerald-900/40 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <p className="col-span-full text-center text-slate-400 py-8">Loading suppliers...</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-slate-400 py-8">No suppliers found.</p>
          ) : (
            filtered.map((sup) => (
              <div
                key={sup._id}
                className="bg-slate-900/80 border border-emerald-900/40 hover:border-emerald-700/60 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{sup.name}</h3>
                    <p className="text-xs text-slate-400">Contact: {sup.contactPerson || 'N/A'}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      sup.pendingPayment > 0
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {sup.pendingPayment > 0 ? 'Pay Pending' : 'Paid'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">GST: {sup.gstNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400">Total Purchased</p>
                    <p className="font-bold text-white text-sm">₹{sup.totalPurchased}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Pending Dues</p>
                    <p className="font-bold text-amber-300">₹{sup.pendingPayment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Add Supplier */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Add New Supplier
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Supplier Business Name</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Agro Pulse Traders"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Contact Person</label>
                    <input
                      {...register('contactPerson')}
                      placeholder="Ramesh Kumar"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Phone Number</label>
                    <input
                      {...register('phone')}
                      placeholder="+91 9811223344"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    {errors.phone && <p className="text-rose-400 text-[10px] mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address</label>
                    <input
                      {...register('email')}
                      placeholder="supplier@pulses.com"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">GST Number</label>
                    <input
                      {...register('gstNumber')}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
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
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Supplier
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
