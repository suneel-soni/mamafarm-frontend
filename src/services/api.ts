import axios from 'axios';
import { Material, Supplier, Shop } from '../types';

const getBaseApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5000/api';
};

const API_URL = getBaseApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mamafarm_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  isFallback?: boolean;
  statusCode?: number;
}

export const extractApiError = (error: any): { message: string; statusCode?: number; isNetworkError: boolean } => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    let message = data?.message || data?.error;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      message = data.errors.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
    }

    if (!message) {
      if (status === 400) message = 'Invalid data submitted. Please check inputs.';
      else if (status === 401) message = 'Session expired or unauthenticated. Please log in.';
      else if (status === 403) message = 'Access denied. You lack permissions for this action.';
      else if (status === 404) message = 'Requested record or endpoint not found on server.';
      else if (status === 409) message = 'A record with these details already exists.';
      else if (status === 413) message = 'Payload or image file exceeds size limit.';
      else if (status >= 500) message = 'Server internal error. Please try again later.';
      else message = `Server error HTTP ${status}`;
    }

    return { message, statusCode: status, isNetworkError: false };
  } else if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return { message: 'Server connection timed out.', isNetworkError: true };
    }
    return { message: 'Unable to connect to MamaFarm server. Operating in offline mode.', isNetworkError: true };
  } else {
    return { message: error.message || 'An unexpected client error occurred.', isNetworkError: false };
  }
};

// Helper for client-side persistent storage fallback
const getStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`mamafarm_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`mamafarm_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
};

// Initialize empty local storage structure and clean up legacy dummy seed data
const initSeedData = () => {
  if (typeof window === 'undefined') return;

  // Purge legacy dummy seed data (SHOP-101, SHOP-102, MAT-101, etc.) if present in browser storage
  const cleanLocalStorage = (key: string, dummyIdsOrCodes: string[]) => {
    const items = getStorage<any[]>(key, []);
    if (
      items.some(
        (i) =>
          dummyIdsOrCodes.includes(i.shopCode) ||
          dummyIdsOrCodes.includes(i.materialCode) ||
          dummyIdsOrCodes.includes(i.supplierCode) ||
          dummyIdsOrCodes.includes(i._id)
      )
    ) {
      const filtered = items.filter(
        (i) =>
          !dummyIdsOrCodes.includes(i.shopCode) &&
          !dummyIdsOrCodes.includes(i.materialCode) &&
          !dummyIdsOrCodes.includes(i.supplierCode) &&
          !dummyIdsOrCodes.includes(i._id)
      );
      setStorage(key, filtered);
    }
  };

  cleanLocalStorage('shops', ['SHOP-101', 'SHOP-102', '6a6318e02d2a89cee171ce4d', '6a6318e02d2a89cee171ce4f']);
  cleanLocalStorage('materials', ['MAT-101', 'MAT-102']);
  cleanLocalStorage('suppliers', ['SUP-101']);
  cleanLocalStorage('expenses', ['EXP-101']);

  if (!localStorage.getItem('mamafarm_shops')) {
    setStorage('shops', []);
  }

  if (!localStorage.getItem('mamafarm_deliveries')) {
    setStorage('deliveries', []);
  }

  if (!localStorage.getItem('mamafarm_materials')) {
    setStorage('materials', []);
  }

  if (!localStorage.getItem('mamafarm_suppliers')) {
    setStorage('suppliers', []);
  }

  if (!localStorage.getItem('mamafarm_expenses')) {
    setStorage('expenses', []);
  }
};

initSeedData();

export const authAPI = {
  login: async (mobile: string, password: string): Promise<ApiResponse> => {
    try {
      const res = await api.post('/auth/login', { mobile, password });
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
    }
  },
  getMe: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
    }
  },
};

export const dashboardAPI = {
  getSummary: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/dashboard');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const shops = getStorage<any[]>('shops', []);
      const deliveries = getStorage<any[]>('deliveries', []);
      const expenses = getStorage<any[]>('expenses', []);

      const totalRevenue = deliveries.reduce((acc, d) => acc + (d.netAmount || 0), 0);
      const totalCollected = deliveries.reduce((acc, d) => acc + (d.amountPaid || 0), 0);
      const totalShopDues = shops.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);
      const totalOperatingExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: {
          kpis: {
            totalRevenue,
            totalCollected,
            netProfit: totalRevenue - totalOperatingExpense,
            totalShopDues,
            totalSupplierDues: 0,
            totalMaterialCost: 0,
            totalOperatingExpense,
            sproutsStock: 0,
            lowStockAlertsCount: 0,
          },
          chartData: [],
          recentActivities: deliveries.slice(-5).map((d) => ({
            _id: d._id,
            description: `Dispatched ${d.netAmount ? `₹${d.netAmount}` : ''} to ${d.shopName || 'Partner'}`,
            timestamp: d.deliveryDate || new Date().toISOString(),
          })),
        },
      };
    }
  },
  getSalesPerformance: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/dashboard/sales');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const shops = getStorage<any[]>('shops', []);
      const deliveries = getStorage<any[]>('deliveries', []);
      const totalRev = deliveries.reduce((acc, d) => acc + (d.netAmount || 0), 0);
      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: {
          todaySales: 0,
          weeklySales: totalRev,
          monthlySales: totalRev,
          totalRevenue: totalRev,
          pendingCollection: 0,
          topPerformingShops: shops.slice(0, 3),
          dailyGraph: [],
          monthlyGraph: [],
        },
      };
    }
  },
};

export const materialsAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/materials');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('materials', []) };
    }
  },
  getSummary: async (params?: any): Promise<ApiResponse> => {
    try {
      const res = await api.get('/materials/summary', { params });
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const materials = getStorage<any[]>('materials', []);
      const totalPurchaseCost = materials.reduce((acc, m) => acc + (m.currentStock || 0) * (m.unitPrice || 0), 0);
      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: {
          totalPurchaseCost,
          numberOfPurchases: materials.length,
          averagePurchaseCost: materials.length ? Math.round(totalPurchaseCost / materials.length) : 0,
          groupedSummary: materials,
        },
      };
    }
  },
  create: async (data: Partial<Material>): Promise<ApiResponse> => {
    try {
      const res = await api.post('/materials', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('materials', []);
      const newMaterial = {
        _id: `MAT-${101 + list.length}`,
        materialCode: `MAT-${101 + list.length}`,
        ...data,
      };
      setStorage('materials', [newMaterial, ...list]);
      return { success: true, isFallback: true, message: 'Server offline. Material saved locally.', data: newMaterial };
    }
  },
  update: async (id: string, data: Partial<Material>): Promise<ApiResponse> => {
    try {
      const res = await api.put(`/materials/${id}`, data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('materials', []);
      const updated = list.map((m) => (m._id === id || m.materialCode === id ? { ...m, ...data } : m));
      setStorage('materials', updated);
      return { success: true, isFallback: true, message: 'Server offline. Updated locally.', data: { _id: id, ...data } };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete(`/materials/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('materials', []);
      const updated = list.filter((m) => m._id !== id && m.materialCode !== id);
      setStorage('materials', updated);
      return { success: true, isFallback: true, message: 'Server offline. Material deleted locally.' };
    }
  },
};

export const suppliersAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/suppliers');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('suppliers', []) };
    }
  },
  create: async (data: Partial<Supplier>): Promise<ApiResponse> => {
    try {
      const res = await api.post('/suppliers', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('suppliers', []);
      const newSupplier = {
        _id: `SUP-${101 + list.length}`,
        supplierCode: `SUP-${101 + list.length}`,
        ...data,
      };
      setStorage('suppliers', [newSupplier, ...list]);
      return { success: true, isFallback: true, message: 'Server offline. Supplier saved locally.', data: newSupplier };
    }
  },
};

export const shopsAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/shops');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setStorage('shops', res.data.data);
      }
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('shops', []) };
    }
  },
  getById: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.get(`/shops/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const shops = getStorage<any[]>('shops', []);
      const deliveries = getStorage<any[]>('deliveries', []);
      const shop = shops.find((s) => s._id === id || s.shopCode === id) || shops[0];
      const shopDeliveries = deliveries.filter((d) => d.shopId === shop?._id || d.shop === shop?._id);

      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: {
          shop,
          summary: {
            totalDeliveredQty: shop?.totalDeliveredQuantity || 50,
            totalReturnedQty: shop?.totalReturnedQuantity || 10,
            currentQuantity: shop?.currentQuantity || 40,
            pendingPayment: shop?.outstandingBalance || 1800,
          },
          salesGraph: [
            { date: 'Jul 18', amount: 1200 },
            { date: 'Jul 21', amount: 1800 },
            { date: 'Jul 24', amount: 2400 },
          ],
          deliveryHistory: shopDeliveries,
          ledger: shopDeliveries.map((d) => ({
            date: new Date(d.deliveryDate || Date.now()).toLocaleDateString('en-IN'),
            type: 'delivery',
            reference: d.deliveryNumber || 'DEL-2026',
            description: `Dispatched ${d.items?.map((i: any) => `${i.quantity} ${i.sproutType}`).join(', ') || 'Sprouts'}`,
            debit: d.netAmount || 0,
            credit: d.amountPaid || 0,
            balance: (d.netAmount || 0) - (d.amountPaid || 0),
          })),
        },
      };
    }
  },
  create: async (data: Partial<Shop>): Promise<ApiResponse> => {
    try {
      const res = await api.post('/shops', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('shops', []);
      const newShop = {
        _id: `SHOP-${101 + list.length}`,
        shopCode: `SHOP-${101 + list.length}`,
        currentQuantity: 0,
        outstandingBalance: 0,
        totalDeliveredQuantity: 0,
        totalReturnedQuantity: 0,
        totalDeliveredValue: 0,
        totalPaidAmount: 0,
        ...data,
      };
      setStorage('shops', [newShop, ...list]);
      return { success: true, isFallback: true, message: 'Server offline. Shop created locally.', data: newShop };
    }
  },
  update: async (id: string, data: Partial<Shop>): Promise<ApiResponse> => {
    try {
      const res = await api.put(`/shops/${id}`, data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('shops', []);
      const updated = list.map((s) => (s._id === id || s.shopCode === id ? { ...s, ...data } : s));
      setStorage('shops', updated);
      return { success: true, isFallback: true, message: 'Server offline. Shop updated locally.', data: { _id: id, ...data } };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete(`/shops/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('shops', []);
      const updated = list.filter((s) => s._id !== id && s.shopCode !== id);
      setStorage('shops', updated);
      return { success: true, isFallback: true, message: 'Server offline. Shop deleted locally.' };
    }
  },
};

export const deliveriesAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/deliveries');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('deliveries', []) };
    }
  },
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/deliveries', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const deliveries = getStorage<any[]>('deliveries', []);
      const shops = getStorage<any[]>('shops', []);
      const shop = shops.find((s) => s._id === data.shopId || s.shopCode === data.shopId);
      const qty = data.items?.reduce((acc: number, i: any) => acc + Number(i.quantity || 0), 0) || 0;
      const amount = data.items?.reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0) || 0;
      const paid = Number(data.amountPaid || 0);

      const newDelivery = {
        _id: `DEL-${101 + deliveries.length}`,
        deliveryNumber: `DEL-2026-00${deliveries.length + 1}`,
        shopId: data.shopId,
        shopName: shop?.shopName || 'Partner Store',
        deliveryDate: data.deliveryDate || new Date().toISOString(),
        items: data.items || [],
        netAmount: amount,
        amountPaid: paid,
        paymentStatus: paid >= amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      };

      if (shop) {
        shop.totalDeliveredQuantity = (shop.totalDeliveredQuantity || 0) + qty;
        shop.totalDeliveredValue = (shop.totalDeliveredValue || 0) + amount;
        shop.totalPaidAmount = (shop.totalPaidAmount || 0) + paid;
        shop.currentQuantity = (shop.totalDeliveredQuantity || 0) - (shop.totalReturnedQuantity || 0);
        shop.outstandingBalance = (shop.totalDeliveredValue || 0) - (shop.totalPaidAmount || 0);
        setStorage('shops', shops);
      }

      setStorage('deliveries', [newDelivery, ...deliveries]);
      return { success: true, isFallback: true, message: 'Server offline. Dispatch recorded locally.', data: newDelivery };
    }
  },
  update: async (id: string, data: any): Promise<ApiResponse> => {
    try {
      const res = await api.put(`/deliveries/${id}`, data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('deliveries', []);
      const index = list.findIndex((d) => d._id === id || d.deliveryNumber === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        setStorage('deliveries', list);
      }
      return { success: true, isFallback: true, message: 'Server offline. Delivery updated locally.' };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete(`/deliveries/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('deliveries', []);
      const updated = list.filter((d) => d._id !== id);
      setStorage('deliveries', updated);
      return { success: true, isFallback: true, message: 'Server offline. Delivery deleted locally.' };
    }
  },
  deleteAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.delete('/deliveries');
      setStorage('deliveries', []);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      setStorage('deliveries', []);
      return { success: true, isFallback: true, message: 'Server offline. Deliveries cleared locally.' };
    }
  },
};

export const returnsAPI = {
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/returns', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const returns = getStorage<any[]>('returns', []);
      const shops = getStorage<any[]>('shops', []);
      const shop = shops.find((s) => s._id === data.shopId || s.shopCode === data.shopId);
      const qty = data.items?.reduce((acc: number, i: any) => acc + Number(i.quantity || 0), 0) || 0;
      const isRep = data.type === 'replacement' || data.isReplacement === true;

      if (shop) {
        if (isRep) {
          shop.totalReplacedQuantity = (shop.totalReplacedQuantity || 0) + qty;
        } else {
          shop.totalReturnedQuantity = (shop.totalReturnedQuantity || 0) + qty;
          shop.currentQuantity = Math.max(0, (shop.totalDeliveredQuantity || 0) - shop.totalReturnedQuantity);
        }
        setStorage('shops', shops);
      }

      const prefix = isRep ? 'REP' : 'RET';
      const newReturn = {
        _id: `${prefix}-${101 + returns.length}`,
        returnNumber: `${prefix}-2026-0${returns.length + 1}`,
        ...data,
        type: isRep ? 'replacement' : 'return',
        isReplacement: isRep,
        totalRefundAmount: isRep ? 0 : (data.totalRefundAmount || 0),
        createdAt: new Date().toISOString(),
      };

      setStorage('returns', [newReturn, ...returns]);
      return {
        success: true,
        isFallback: true,
        message: `Server offline. ${isRep ? 'Replacement' : 'Return'} recorded locally.`,
        data: newReturn,
      };
    }
  },
  update: async (id: string, data: any): Promise<ApiResponse> => {
    try {
      const res = await api.put(`/returns/${id}`, data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const returns = getStorage<any[]>('returns', []);
      const index = returns.findIndex((r) => r._id === id || r.returnNumber === id);
      if (index !== -1) {
        returns[index] = { ...returns[index], ...data };
        setStorage('returns', returns);
      }
      return { success: true, isFallback: true, message: 'Server offline. Record updated locally.' };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete(`/returns/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const returns = getStorage<any[]>('returns', []);
      const updated = returns.filter((r) => r._id !== id && r.returnNumber !== id);
      setStorage('returns', updated);
      return { success: true, isFallback: true, message: 'Server offline. Record deleted locally.' };
    }
  },
  getAll: async (shopId?: string): Promise<ApiResponse> => {
    try {
      const res = await api.get('/returns', { params: { shopId } });
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const returns = getStorage<any[]>('returns', []);
      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: shopId ? returns.filter((r) => r.shopId === shopId || r.shop === shopId) : returns,
      };
    }
  },
};

export const paymentsAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/payments');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('payments', []) };
    }
  },
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/payments', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const payments = getStorage<any[]>('payments', []);
      const shops = getStorage<any[]>('shops', []);
      const shop = shops.find((s) => s._id === data.shopId || s.shopCode === data.shopId);
      const paid = Number(data.amountPaid || data.amount || 0);

      if (shop) {
        shop.totalPaidAmount = (shop.totalPaidAmount || 0) + paid;
        shop.outstandingBalance = Math.max(0, (shop.totalDeliveredValue || 0) - shop.totalPaidAmount);
        setStorage('shops', shops);
      }

      const newPayment = {
        _id: `PAY-${101 + payments.length}`,
        ...data,
        createdAt: new Date().toISOString(),
      };

      setStorage('payments', [newPayment, ...payments]);
      return { success: true, isFallback: true, message: 'Server offline. Payment recorded locally.', data: newPayment };
    }
  },
};

export const productionAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/production');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: getStorage('production', [
          {
            _id: 'PROD-101',
            batchNumber: 'BATCH-2026-01',
            sproutType: 'Moong Sprouts',
            quantityKg: 50,
            packetsProduced: 250,
            status: 'completed',
            startDate: new Date().toISOString(),
          },
        ]),
      };
    }
  },
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/production', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('production', []);
      const newBatch = {
        _id: `PROD-${101 + list.length}`,
        batchNumber: `BATCH-2026-0${list.length + 1}`,
        ...data,
      };
      setStorage('production', [newBatch, ...list]);
      return { success: true, isFallback: true, message: 'Server offline. Production batch saved locally.', data: newBatch };
    }
  },
};

export const inventoryAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/inventory');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: getStorage('inventory', []),
      };
    }
  },
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/inventory', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('inventory', []);
      const newItem = {
        _id: `INV-${101 + list.length}`,
        ...data,
      };
      setStorage('inventory', [...list, newItem]);
      return { success: true, isFallback: true, message: 'Server offline. Inventory item saved locally.', data: newItem };
    }
  },
  update: async (id: string, data: any): Promise<ApiResponse> => {
    try {
      const res = await api.put(`/inventory/${id}`, data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete(`/inventory/${id}`);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('inventory', []);
      const updated = list.filter((i) => i._id !== id);
      setStorage('inventory', updated);
      return { success: true, isFallback: true, message: 'Server offline. Item deleted locally.' };
    }
  },
  deleteAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.delete('/inventory');
      setStorage('inventory', []);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      setStorage('inventory', []);
      return { success: true, isFallback: true, message: 'Server offline. Inventory cleared locally.' };
    }
  },
};

export const expensesAPI = {
  getAll: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/expenses');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      return { success: true, isFallback: true, message: errInfo.message, data: getStorage('expenses', []) };
    }
  },
  create: async (data: any): Promise<ApiResponse> => {
    try {
      const res = await api.post('/expenses', data);
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      if (!errInfo.isNetworkError) {
        return { success: false, message: errInfo.message, statusCode: errInfo.statusCode };
      }
      const list = getStorage<any[]>('expenses', []);
      const newExp = {
        _id: `EXP-${101 + list.length}`,
        ...data,
      };
      setStorage('expenses', [newExp, ...list]);
      return { success: true, isFallback: true, message: 'Server offline. Expense logged locally.', data: newExp };
    }
  },
};

export const reportsAPI = {
  getReports: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get('/reports');
      return res.data;
    } catch (error: any) {
      const errInfo = extractApiError(error);
      const shops = getStorage<any[]>('shops', []);
      const expenses = getStorage<any[]>('expenses', []);

      const totalRevenue = shops.reduce((acc, s) => acc + (s.totalDeliveredValue || 0), 36500);
      const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 2500);

      return {
        success: true,
        isFallback: true,
        message: errInfo.message,
        data: {
          summary: {
            totalRevenue,
            totalMaterialCost: 12000,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses - 12000,
            deliveryCount: 12,
            productionBatchCount: 4,
          },
          profitAndLoss: {
            grossRevenue: totalRevenue,
            costOfGoodsSold: 12000,
            operatingExpenses: totalExpenses,
            netProfitMargin: Math.round(((totalRevenue - totalExpenses - 12000) / (totalRevenue || 1)) * 100),
          },
          shopPerformance: shops,
          supplierBreakdown: getStorage('suppliers', []),
          inventoryStatus: getStorage('inventory', []),
        },
      };
    }
  },
};

export default api;
