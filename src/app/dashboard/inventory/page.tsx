'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { inventoryAPI, materialsAPI, suppliersAPI } from '@/services/api';
import { InventoryItem, Material, Supplier } from '@/types';
import {
  Boxes,
  AlertTriangle,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  X,
  Loader2,
  Wheat,
  Package,
  DollarSign,
  Layers,
  ShoppingBag,
  Calendar,
  Check,
  RefreshCw,
  TrendingDown,
  ArrowDownLeft,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { allowOnlyNumbersKeys, allowOnlyDecimalKeys, sanitizeInteger, sanitizeDecimal } from '@/utils/inputValidation';
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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchasedMaterials, setPurchasedMaterials] = useState<Material[]>([]);
  const [procurementStats, setProcurementStats] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'procurement' | 'summary'>('procurement');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'raw_bean' | 'packaging' | 'other'>('all');

  // Modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock SKU Form state
  const [itemName, setItemName] = useState('');
  const [type, setType] = useState('raw_material');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState(10);
  const [valuationPerUnit, setValuationPerUnit] = useState(0);

  // Purchase Form
  const {
    register,
    handleSubmit,
    reset: resetPurchaseForm,
    formState: { errors: purchaseErrors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      category: 'Raw Bean',
      unit: 'kg',
      paymentStatus: 'paid',
      quantity: 10,
      purchasePrice: 90,
    },
  });

  const { showSuccess, showError, showWarning } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, suppRes] = await Promise.all([
        inventoryAPI.getAll(),
        suppliersAPI.getAll().catch(() => ({ success: false, data: [] })),
      ]);

      if (invRes.success) {
        const raw = invRes.data;
        const list = Array.isArray(raw) ? raw : raw?.items || [];
        const normalized: InventoryItem[] = list.map((item: any) => ({
          _id: item._id || item.id || `INV-${Math.random().toString(36).substring(2, 7)}`,
          itemName: item.itemName || item.name || 'Stock Item',
          type: item.type || item.category || 'raw_material',
          quantity: Number(item.quantity) || 0,
          unit: item.unit || 'kg',
          minThreshold: Number(item.minThreshold ?? item.minAlert ?? 10),
          valuationPerUnit: Number(item.valuationPerUnit ?? item.pricePerUnit ?? 0),
          location: item.location || 'Main Store',
        }));
        setInventory(normalized);

        if (raw?.purchasedMaterials) {
          setPurchasedMaterials(raw.purchasedMaterials);
        }
        if (raw?.procurementStats) {
          setProcurementStats(raw.procurementStats);
        }
      }

      // If purchased materials were not returned in inventory, fetch directly
      if (!invRes.data?.purchasedMaterials) {
        const matRes = await materialsAPI.getAll().catch(() => ({ success: false, data: [] }));
        if (matRes.success && Array.isArray(matRes.data)) {
          setPurchasedMaterials(matRes.data);
        }
      }

      if (suppRes.success && Array.isArray(suppRes.data)) {
        setSuppliers(suppRes.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load inventory & procurement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        setStockModalOpen(false);
        setItemName('');
        setQuantity(0);
        setValuationPerUnit(0);
        loadData();
      } else {
        showError(res.message || 'Failed to create stock item.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while adding stock item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPurchase = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      const res = await materialsAPI.create(data);
      if (res.success) {
        showSuccess(`Recorded purchase of ${data.quantity} ${data.unit} ${data.name}! Stock updated.`);
        setPurchaseModalOpen(false);
        resetPurchaseForm();
        loadData();
      } else {
        showError(res.message || 'Failed to record material purchase.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while recording material purchase.');
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
        loadData();
      } else {
        showError(res.message || 'Failed to delete item.');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting inventory item.');
    }
  };

  // Safe collections & calculations
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safePurchased = Array.isArray(purchasedMaterials) ? purchasedMaterials : [];

  // Computed Real-time Stats
  const totalStockValuation = safeInventory.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.valuationPerUnit) || 0),
    0
  );

  const lowStockCount = safeInventory.filter(
    (item) => (Number(item?.quantity) || 0) <= (Number(item?.minThreshold) || 10)
  ).length;

  const totalProcurementSpend = useMemo(() => {
    return safePurchased.reduce(
      (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.purchasePrice) || 0),
      0
    );
  }, [safePurchased]);

  const rawBeanProcured = useMemo(() => {
    let cost = 0;
    let qty = 0;
    safePurchased.forEach((m) => {
      const cat = (m.category || '').toLowerCase();
      if (cat.includes('raw') || cat.includes('bean') || cat.includes('grain')) {
        const itemQty = Number(m.quantity) || 0;
        qty += itemQty;
        cost += itemQty * (Number(m.purchasePrice) || 0);
      }
    });
    return { cost, qty };
  }, [safePurchased]);

  const packagingProcured = useMemo(() => {
    let cost = 0;
    let qty = 0;
    safePurchased.forEach((m) => {
      const cat = (m.category || '').toLowerCase();
      if (cat.includes('pack') || cat.includes('box') || cat.includes('pouch') || cat.includes('sticker')) {
        const itemQty = Number(m.quantity) || 0;
        qty += itemQty;
        cost += itemQty * (Number(m.purchasePrice) || 0);
      }
    });
    return { cost, qty };
  }, [safePurchased]);

  // Item-wise Procurement Aggregate Summary
  const itemWiseSummary = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        itemName: string;
        category: string;
        unit: string;
        totalQuantity: number;
        totalSpent: number;
        avgPrice: number;
        purchaseCount: number;
        currentStock?: number;
      }
    > = {};

    safePurchased.forEach((m) => {
      const key = (m.name || 'Unknown').trim();
      const qty = Number(m.quantity) || 0;
      const price = Number(m.purchasePrice) || 0;
      const totalAmount = qty * price;

      if (!summaryMap[key]) {
        // Find current stock if present
        const invMatch = safeInventory.find(
          (inv) => inv.itemName.toLowerCase().trim() === key.toLowerCase()
        );
        summaryMap[key] = {
          itemName: key,
          category: m.category || 'Raw Bean',
          unit: m.unit || 'kg',
          totalQuantity: 0,
          totalSpent: 0,
          avgPrice: 0,
          purchaseCount: 0,
          currentStock: invMatch ? invMatch.quantity : undefined,
        };
      }

      summaryMap[key].totalQuantity += qty;
      summaryMap[key].totalSpent += totalAmount;
      summaryMap[key].purchaseCount += 1;
      summaryMap[key].avgPrice = Math.round(
        summaryMap[key].totalSpent / (summaryMap[key].totalQuantity || 1)
      );
    });

    return Object.values(summaryMap);
  }, [safePurchased, safeInventory]);

  // Filtered Stock Matrix
  const filteredInventory = safeInventory.filter((item) => {
    const matchSearch =
      (item?.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item?.type || '').toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (categoryFilter === 'raw_bean') {
      const t = (item.type || '').toLowerCase();
      return t.includes('raw') || t.includes('bean');
    }
    if (categoryFilter === 'packaging') {
      const t = (item.type || '').toLowerCase();
      return t.includes('pack');
    }
    if (categoryFilter === 'other') {
      const t = (item.type || '').toLowerCase();
      return !t.includes('raw') && !t.includes('pack');
    }
    return true;
  });

  // Filtered Purchased Materials Ledger
  const filteredPurchasedMaterials = safePurchased.filter((m) => {
    const sName = typeof m.supplier === 'object' ? m.supplier?.name : '';
    const matchSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (sName || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (categoryFilter === 'raw_bean') {
      const c = (m.category || '').toLowerCase();
      return c.includes('raw') || c.includes('bean') || c.includes('grain');
    }
    if (categoryFilter === 'packaging') {
      const c = (m.category || '').toLowerCase();
      return c.includes('pack') || c.includes('box') || c.includes('pouch') || c.includes('sticker');
    }
    if (categoryFilter === 'other') {
      const c = (m.category || '').toLowerCase();
      return !c.includes('raw') && !c.includes('pack');
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header with Title & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
              Inventory & Material Procurement
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Track material purchases, inflow quantities, procurement spend, and live stock on-hand
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPurchaseModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Record Purchase</span>
            </button>
            <button
              onClick={() => setStockModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-emerald-900/40 px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock SKU</span>
            </button>
          </div>
        </div>

        {/* 4-Card KPI Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Total Material Procurement Spend */}
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Total Procured
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-emerald-400 mt-1">
              ₹{totalProcurementSpend.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between text-[9px] text-emerald-300/80 mt-1 font-bold">
              <span>{safePurchased.length} Purchases Tracked</span>
              <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">Inflow</span>
            </div>
          </div>

          {/* 2. Raw Beans Procured */}
          <div className="bg-slate-900/90 border border-amber-900/40 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Raw Beans Inflow</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Wheat className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-amber-400 mt-1">
              ₹{rawBeanProcured.cost.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between text-[9px] text-amber-300/80 mt-1 font-bold">
              <span>{rawBeanProcured.qty.toLocaleString('en-IN')} kg total</span>
              <span className="bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">Grains</span>
            </div>
          </div>

          {/* 3. Packaging & Pouches Procured */}
          <div className="bg-slate-900/90 border border-teal-900/40 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Packaging Inflow</span>
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-teal-400" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-teal-400 mt-1">
              ₹{packagingProcured.cost.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between text-[9px] text-teal-300/80 mt-1 font-bold">
              <span>{packagingProcured.qty.toLocaleString('en-IN')} units</span>
              <span className="bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/40">Boxes & Pouches</span>
            </div>
          </div>

          {/* 4. Current Stock Valuation & Safety Alert */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Stock Valuation</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-white mt-1">
              ₹{totalStockValuation.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-semibold">
              <span>{safeInventory.length} SKUs On-Hand</span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold ${
                  lowStockCount > 0
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'Stock Healthy'}
              </span>
            </div>
          </div>
        </div>

        {/* View Selection Tabs & Search / Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 border border-emerald-900/40 p-3 rounded-2xl">
          {/* Segmented View Switch */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-emerald-900/30 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('procurement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'procurement'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Purchased Materials Ledger ({safePurchased.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Stock In Hand Matrix ({safeInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Item Procurement Summary ({itemWiseSummary.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'procurement'
                    ? 'Search purchases by item, supplier...'
                    : 'Search inventory SKUs...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/90 border border-emerald-900/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-800/90 border border-emerald-900/40 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              <option value="all">All Categories</option>
              <option value="raw_bean">Raw Beans</option>
              <option value="packaging">Packaging</option>
              <option value="other">Other Supplies</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Purchased Materials Ledger (Item purchases, quantities, rates, amounts, supplier, date) */}
        {activeTab === 'procurement' && (
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-emerald-900/30 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  Material Purchases & Inflow Log
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Detailed ledger of all raw grains and packaging procured with quantities and amounts spent
                </p>
              </div>
              <button
                onClick={loadData}
                title="Refresh ledger"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[10px] border-b border-emerald-900/40">
                  <tr>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Item Purchased</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Quantity Procured</th>
                    <th className="p-3">Rate / Unit</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/20">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading material purchase logs...
                      </td>
                    </tr>
                  ) : filteredPurchasedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No material purchases match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchasedMaterials.map((mat) => {
                      const catLower = (mat.category || '').toLowerCase();
                      const isRawBean =
                        catLower.includes('raw') || catLower.includes('bean') || catLower.includes('grain');
                      const isPackaging =
                        catLower.includes('pack') ||
                        catLower.includes('box') ||
                        catLower.includes('pouch') ||
                        catLower.includes('sticker');

                      const totalAmt = Math.round((mat.quantity || 0) * (mat.purchasePrice || 0));
                      const dateStr = mat.purchaseDate
                        ? new Date(mat.purchaseDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—';

                      return (
                        <tr key={mat._id} className="hover:bg-emerald-900/10 transition-colors">
                          <td className="p-3 text-slate-400 whitespace-nowrap text-[11px] flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {dateStr}
                          </td>
                          <td className="p-3 font-bold text-white whitespace-nowrap">{mat.name}</td>
                          <td className="p-3">
                            {isRawBean ? (
                              <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/40 rounded text-[9px] font-bold">
                                Raw Bean
                              </span>
                            ) : isPackaging ? (
                              <span className="px-2 py-0.5 bg-teal-950/80 text-teal-300 border border-teal-800/40 rounded text-[9px] font-bold">
                                Packaging
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-medium">
                                {mat.category || 'Other'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-300 text-xs whitespace-nowrap">
                            {mat.quantity} {mat.unit}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            ₹{mat.purchasePrice}/{mat.unit}
                          </td>
                          <td className="p-3 font-extrabold text-white text-xs whitespace-nowrap">
                            ₹{totalAmt.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap text-[11px]">
                            {typeof mat.supplier === 'object' ? mat.supplier?.name : 'Local Trade'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                mat.paymentStatus === 'paid'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : mat.paymentStatus === 'pending'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              }`}
                            >
                              {mat.paymentStatus || 'paid'}
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
        )}

        {/* Tab 2: Stock In Hand Matrix */}
        {activeTab === 'matrix' && (
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-emerald-900/30 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  Live Stock On-Hand Matrix
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Real-time stock balance, valuation per unit, and safety replenishment alerts
                </p>
              </div>
              <button
                onClick={loadData}
                title="Refresh stock matrix"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[10px] border-b border-emerald-900/40">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category Type</th>
                    <th className="p-3">Stock In Hand</th>
                    <th className="p-3">Min Alert</th>
                    <th className="p-3">Valuation / Unit</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/20">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading inventory levels...
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No stock items found in matrix.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLow = (Number(item?.quantity) || 0) <= (Number(item?.minThreshold) || 10);
                      const stockVal = (Number(item?.quantity) || 0) * (Number(item?.valuationPerUnit) || 0);

                      return (
                        <tr key={item._id} className="hover:bg-emerald-900/10 transition-colors">
                          <td className="p-3 font-bold text-white whitespace-nowrap">{item.itemName}</td>
                          <td className="p-3 uppercase text-slate-400 text-[9px] font-semibold">
                            {item.type?.replace('_', ' ')}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-300 text-xs whitespace-nowrap">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {item.minThreshold} {item.unit}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">₹{item.valuationPerUnit || 0}</td>
                          <td className="p-3 font-extrabold text-white whitespace-nowrap">
                            ₹{stockVal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 w-max ${
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
                          <td className="p-3 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteItem(item._id, item.itemName)}
                              title="Delete Stock Item"
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-900/50 rounded-lg border border-rose-900/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        )}

        {/* Tab 3: Item-Wise Procurement Summary */}
        {activeTab === 'summary' && (
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-emerald-900/30 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Item-Wise Procurement & Stock Summary
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rollup of total quantities procured, cumulative expenditure, average rate, and current stock in hand
                </p>
              </div>
              <button
                onClick={loadData}
                title="Refresh summary"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-emerald-400 uppercase font-semibold text-[10px] border-b border-emerald-900/40">
                  <tr>
                    <th className="p-3">Material Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Total Procured Qty</th>
                    <th className="p-3">Total Procurement Spend</th>
                    <th className="p-3">Avg Rate / Unit</th>
                    <th className="p-3">Purchases Count</th>
                    <th className="p-3">Current Stock in Hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/20">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading item summary...
                      </td>
                    </tr>
                  ) : itemWiseSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No material procurement records found.
                      </td>
                    </tr>
                  ) : (
                    itemWiseSummary.map((item, idx) => {
                      const catLower = (item.category || '').toLowerCase();
                      const isRawBean =
                        catLower.includes('raw') || catLower.includes('bean') || catLower.includes('grain');
                      const isPackaging =
                        catLower.includes('pack') ||
                        catLower.includes('box') ||
                        catLower.includes('pouch') ||
                        catLower.includes('sticker');

                      return (
                        <tr key={idx} className="hover:bg-emerald-900/10 transition-colors">
                          <td className="p-3 font-bold text-white whitespace-nowrap">{item.itemName}</td>
                          <td className="p-3">
                            {isRawBean ? (
                              <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/40 rounded text-[9px] font-bold">
                                Raw Bean
                              </span>
                            ) : isPackaging ? (
                              <span className="px-2 py-0.5 bg-teal-950/80 text-teal-300 border border-teal-800/40 rounded text-[9px] font-bold">
                                Packaging
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-medium">
                                {item.category || 'Other'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-300 text-xs whitespace-nowrap">
                            {item.totalQuantity.toLocaleString('en-IN')} {item.unit}
                          </td>
                          <td className="p-3 font-extrabold text-white text-xs whitespace-nowrap">
                            ₹{item.totalSpent.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            ₹{item.avgPrice}/{item.unit}
                          </td>
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300">
                              {item.purchaseCount} {item.purchaseCount === 1 ? 'order' : 'orders'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {item.currentStock !== undefined ? (
                              <span className="font-bold text-emerald-400">
                                {item.currentStock} {item.unit}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Record Material Purchase */}
        {purchaseModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Record Material Purchase
                </h3>
                <button
                  onClick={() => setPurchaseModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleRecordPurchase)} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 mb-1 block">Material / Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Green Moong, Black Chana, Sprout Box (250ml)"
                    {...register('name')}
                    className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {purchaseErrors.name && (
                    <p className="text-rose-400 text-[10px] mt-0.5">{purchaseErrors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Category</label>
                    <select
                      {...register('category')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Raw Bean">Raw Bean</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Chemicals/Cleaning">Chemicals/Cleaning</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Supplier</label>
                    <select
                      {...register('supplier')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Supplier (Optional)</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Quantity Procured</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 50"
                      {...register('quantity', { valueAsNumber: true })}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                    {purchaseErrors.quantity && (
                      <p className="text-rose-400 text-[10px] mt-0.5">{purchaseErrors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Unit</label>
                    <input
                      type="text"
                      placeholder="kg / pcs / units"
                      {...register('unit')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Rate / Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 110"
                      {...register('purchasePrice', { valueAsNumber: true })}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                    {purchaseErrors.purchasePrice && (
                      <p className="text-rose-400 text-[10px] mt-0.5">{purchaseErrors.purchasePrice.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Invoice / Bill No.</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      {...register('invoiceNumber')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 mb-1 block">Payment Status</label>
                    <select
                      {...register('paymentStatus')}
                      className="w-full bg-slate-800 border border-emerald-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-900/40">
                  <button
                    type="button"
                    onClick={() => setPurchaseModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Record & Sync Stock</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Stock SKU */}
        {stockModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <Boxes className="w-5 h-5" /> Add Stock Matrix Item
                </h3>
                <button
                  onClick={() => setStockModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
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
                    onClick={() => setStockModalOpen(false)}
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
