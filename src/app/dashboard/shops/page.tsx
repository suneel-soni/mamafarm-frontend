'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { shopsAPI } from '@/services/api';
import { Shop } from '@/types';
import { Store, Plus, Search, MapPin, Eye, Check, X, Filter, Edit2, Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { compressImageToMaxKb } from '@/utils/imageCompressor';

const shopSchema = z.object({
  shopName: z.string().min(2, 'Shop Name required'),
  ownerName: z.string().optional(),
  phone: z.string().min(10, 'Phone required'),
  area: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
});

type ShopFormData = z.infer<typeof shopSchema>;

export default function ShopCardsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dues' | 'qty' | 'name'>('dues');
  
  // Modal & Edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchImage = watch('image');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64, sizeKb } = await compressImageToMaxKb(file, 100);
      setValue('image', base64);
      showSuccess(`Photo compressed to ${sizeKb}KB and attached!`);
    } catch (err: any) {
      showError(err.message || 'Error compressing shop photo.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setValue('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadShops = async () => {
    setLoading(true);
    try {
      const res = await shopsAPI.getAll();
      if (res.success) {
        setShops(res.data || []);
        if (res.isFallback) {
          showWarning(res.message || 'Server offline. Showing cached shop partners.');
        }
      } else {
        showError(res.message || 'Failed to load retail shops.');
      }
    } catch (err: any) {
      showError(err.message || 'Unexpected error loading retail shops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const openAddModal = () => {
    setEditingShop(null);
    reset({
      shopName: '',
      ownerName: '',
      phone: '',
      area: '',
      address: '',
      image: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (shop: Shop) => {
    setEditingShop(shop);
    setValue('shopName', shop.shopName || '');
    setValue('ownerName', shop.ownerName || '');
    setValue('phone', shop.phone || '');
    setValue('area', shop.area || '');
    setValue('address', shop.address || '');
    setValue('image', shop.image || '');
    setModalOpen(true);
  };

  const onSubmit = async (data: ShopFormData) => {
    setIsSubmitting(true);
    try {
      if (editingShop) {
        const res = await shopsAPI.update(editingShop._id, data);
        if (res.success) {
          if (res.isFallback) {
            showWarning(res.message || `Updated ${data.shopName} locally.`);
          } else {
            showSuccess(`Updated ${data.shopName} successfully!`);
          }
          setModalOpen(false);
          setEditingShop(null);
          loadShops();
        } else {
          showError(res.message || 'Failed to update shop details.');
        }
      } else {
        const res = await shopsAPI.create(data);
        if (res.success) {
          if (res.isFallback) {
            showWarning(res.message || `Registered ${data.shopName} locally.`);
          } else {
            showSuccess(`Registered ${data.shopName} successfully!`);
          }
          setModalOpen(false);
          reset();
          loadShops();
        } else {
          showError(res.message || 'Failed to register shop partner.');
        }
      }
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShop = async (id: string, shopName: string) => {
    if (!window.confirm(`Are you sure you want to delete retail partner "${shopName}"?`)) return;
    try {
      const res = await shopsAPI.delete(id);
      if (res.success) {
        if (res.isFallback) showWarning(res.message || `Deleted ${shopName} locally.`);
        else showSuccess(`Deleted ${shopName} retail partner.`);
        loadShops();
      } else {
        showError(res.message || 'Failed to delete shop partner.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting shop partner.');
    }
  };

  const filteredShops = shops
    .filter(
      (s) =>
        s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.shopName.localeCompare(b.shopName);
      if (sortBy === 'dues') return b.outstandingBalance - a.outstandingBalance;
      if (sortBy === 'qty') return b.currentQuantity - a.currentQuantity;
      return 0;
    });

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
              <Store className="w-5 h-5 text-emerald-400" />
              Retail Partner Shops
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">{shops.length} active retail partners</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shop, area or phone..."
              className="w-full bg-slate-900 border border-emerald-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-900/30">
            <span className="text-[10px] font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-emerald-400 font-bold text-[11px] focus:outline-none"
            >
              <option value="dues">Highest Dues</option>
              <option value="qty">Highest Delivered Qty</option>
              <option value="name">Shop Name</option>
            </select>
          </div>
        </div>

        {/* Shop Cards Stack */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading shop cards...</div>
          ) : filteredShops.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No shops found matching query.</div>
          ) : (
            filteredShops.map((shop) => (
              <div
                key={shop._id}
                className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-lg space-y-3 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={
                        shop.image ||
                        '/images/shop-placeholder.jpg'
                      }
                      alt={shop.shopName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          {shop.shopCode || ''}
                        </span>
                        <h3 className="font-bold text-white text-xs truncate">{shop.shopName}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(shop)}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Shop Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop._id, shop.shopName)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Delete Shop Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" /> {shop.area || shop.address || 'Market'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 border border-emerald-900/30 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Delivered Qty</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      {shop.currentQuantity || Math.max(0, (shop.totalDeliveredQuantity || 0) - (shop.totalReturnedQuantity || 0))} Packets
                    </p>
                  </div>

                  <div className="bg-slate-800/60 border border-emerald-900/30 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Remaining Payment</p>
                    <p
                      className={`text-xs font-bold mt-0.5 ${
                        shop.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{(shop.outstandingBalance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/shops/details?id=${shop._id || shop.shopCode}`}
                  className="w-full bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Details & Ledger</span>
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add or Edit Shop */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0">
            <div className="bg-slate-900 border-t border-emerald-900/60 rounded-t-3xl w-full max-w-md p-5 shadow-2xl relative space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2.5">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Store className="w-4 h-4" /> {editingShop ? 'Edit Shop Partner' : 'Register Shop Partner'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Shop Name</label>
                  <input
                    {...register('shopName')}
                    placeholder="e.g. Green Market Supermarket"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                  {errors.shopName && <p className="text-[10px] text-rose-400 mt-0.5">{errors.shopName.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Owner Name</label>
                    <input
                      {...register('ownerName')}
                      placeholder="e.g. Neha Sharma"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phone</label>
                    <input
                      {...register('phone')}
                      placeholder="+91 9955443322"
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                    />
                    {errors.phone && <p className="text-[10px] text-rose-400 mt-0.5">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Area / Locality</label>
                  <input
                    {...register('area')}
                    placeholder="e.g. Sector 18 Market"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Address</label>
                  <input
                    {...register('address')}
                    placeholder="e.g. Shop 12, Main Commercial Complex"
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Shop Photo
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {watchImage ? (
                    <div className="relative flex items-center gap-3 p-2 bg-slate-800/80 border border-emerald-900/40 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-emerald-900/50">
                        <img
                          src={watchImage}
                          alt="Shop Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <p className="text-[11px] font-semibold text-emerald-400 truncate">
                          Photo Selected
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 px-2 py-1 rounded-md font-medium transition-all"
                          >
                            Change Photo
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-900/50 hover:border-emerald-500/60 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-emerald-300">
                          Click to upload shop photo
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          PNG, JPG, WEBP (Auto-compressed to max 100KB)
                        </p>
                      </div>
                    </div>
                  )}
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
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-900/40 flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingShop ? 'Update Partner' : 'Save Partner'}
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
