'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { expensesAPI } from '@/services/api';
import { Expense } from '@/types';
import { Receipt, Plus, Check, X, IndianRupee, PieChart, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyDecimalKeys } from '@/utils/inputValidation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const expenseSchema = z.object({
  title: z.string().min(2, 'Title required'),
  category: z.enum(['rent', 'electricity', 'labour', 'transport', 'packaging', 'misc']),
  amount: z.number().min(1, 'Amount required'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer']),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'misc',
      paymentMethod: 'upi',
    },
  });

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll();
      if (res.success) {
        setExpenses(res.data || []);
        if (res.isFallback) showWarning('Server offline. Showing cached expenses.');
      } else {
        showError(res.message || 'Failed to load expenses.');
      }
    } catch (err: any) {
      showError(err.message || 'Unexpected error loading expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const res = await expensesAPI.create(data);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || 'Expense saved locally (Offline mode).');
        else showSuccess(`Recorded expense ₹${data.amount} for ${data.title}!`);
        setModalOpen(false);
        reset();
        loadExpenses();
      } else {
        showError(res.message || 'Failed to save expense.');
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while saving expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

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
              <Receipt className="w-7 h-7 text-emerald-400" />
              Operational Expenses Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Log facility rent, electricity bills, helper wages, fuel, transport and misc costs.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Total Expense Card */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Logged Operating Expense</p>
            <p className="text-3xl font-bold text-rose-400 mt-1">₹{(totalExpense || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[11px] border-b border-emerald-900/40">
                <tr>
                  <th className="p-4">Expense Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-emerald-900/10 transition-colors">
                      <td className="p-4 font-bold text-white">{exp.title}</td>
                      <td className="p-4 uppercase text-slate-400 text-[10px] font-semibold">{exp.category}</td>
                      <td className="p-4 font-bold text-rose-300 text-sm">₹{exp.amount}</td>
                      <td className="p-4 uppercase text-slate-300">{exp.paymentMethod}</td>
                      <td className="p-4 text-slate-400">
                        {new Date(exp.expenseDate || Date.now()).toLocaleDateString('en-IN')}
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
                  <Receipt className="w-5 h-5" /> Log Operating Expense
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Expense Title / Description</label>
                  <input
                    {...register('title')}
                    placeholder="e.g. Processing Shed Rent - July"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Category</label>
                    <select
                      {...register('category')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="rent">Rent</option>
                      <option value="electricity">Electricity / Water</option>
                      <option value="labour">Labour / Helper Wages</option>
                      <option value="transport">Transport / Van Fuel</option>
                      <option value="packaging">Packaging Supplies</option>
                      <option value="misc">Misc</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Amount (₹)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      onKeyDown={allowOnlyDecimalKeys}
                      {...register('amount', { valueAsNumber: true })}
                      placeholder="5000"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Payment Method</label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
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
                    Save Expense
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
