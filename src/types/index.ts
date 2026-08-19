export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  phone?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  totalPurchased: number;
  pendingPayment: number;
  notes?: string;
}

export interface Material {
  _id: string;
  name: string;
  category: 'Raw Bean' | 'Packaging' | 'Chemicals/Cleaning' | 'Other';
  supplier?: string | Supplier;
  quantity: number;
  unit: string;
  purchasePrice: number;
  gstPercent: number;
  totalCostWithGst: number;
  minStockAlert: number;
  purchaseDate: string;
  invoiceNumber?: string;
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
}

export interface MaterialGroupedSummary {
  date: string;
  materials: Material[];
  totalCost: number;
  count: number;
}

export interface CategoryPurchaseStat {
  category: string;
  totalCost: number;
  itemsCount: number;
  totalQuantity?: number;
}

export interface MaterialSummaryData {
  totalPurchaseCost: number;
  numberOfPurchases: number;
  rawBeanStats?: {
    totalCost: number;
    totalQuantity: number;
    count: number;
    primaryUnit?: string;
  };
  packagingStats?: {
    totalCost: number;
    totalQuantity: number;
    count: number;
    primaryUnit?: string;
  };
  categoryBreakdown?: CategoryPurchaseStat[];
  groupedSummary: MaterialGroupedSummary[];
  materials?: Material[];
}

export interface Shop {
  _id: string;
  shopCode?: string;
  shopName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  area?: string;
  gstNumber?: string;
  image?: string;
  totalDeliveredQuantity: number;
  totalReturnedQuantity: number;
  totalReplacedQuantity?: number;
  totalReplacedAmount?: number;
  currentQuantity: number; // Delivered - Returned
  outstandingBalance: number; // Total Amount - Total Received
  totalDeliveredValue: number;
  totalPaidAmount: number;
  lastDeliveryDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface DeliveryItem {
  sproutType: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Delivery {
  _id: string;
  deliveryNumber: string;
  shop: string | Shop;
  shopName: string;
  deliveryDate: string;
  items: DeliveryItem[];
  subTotal: number;
  discount: number;
  netAmount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  deliveryPerson?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnOrder {
  _id: string;
  returnNumber: string;
  type?: 'return' | 'replacement';
  isReplacement?: boolean;
  shop: string | Shop;
  shopName: string;
  deliveryId?: string;
  returnDate: string;
  items: {
    sproutType: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  totalRefundAmount: number;
  reason: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  paymentNumber: string;
  entityType: 'shop' | 'supplier';
  shopId?: string;
  supplierId?: string;
  partyName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  transactionRef?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesPerformanceData {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalRevenue: number;
  totalSalesAllTime?: number;
  totalCollectionAllTime?: number;
  pendingCollection: number;
  totalDeliveredPackets?: number;
  totalDeliveredAmount?: number;
  totalReplacedPackets?: number;
  totalReplacedAmount?: number;
  topPerformingShops: {
    _id: string;
    shopName: string;
    totalSales: number;
    deliveredQty: number;
    image?: string;
  }[];
  dailyGraph: { date: string; sales: number; deliveries?: number }[];
  weeklyGraph?: { week: string; sales: number; deliveries?: number }[];
  monthlyGraph: { month: string; sales: number; collections: number }[];
}

export interface ShopDetailsData {
  shop: Shop;
  summary: {
    totalDeliveredQty: number;
    totalReturnedQty: number;
    totalReplacedQty?: number;
    totalReplacedAmount?: number;
    currentQuantity: number;
    totalDeliveredValue?: number;
    totalDeliveredVal?: number;
    totalPaidAmount?: number;
    totalPaid?: number;
    totalRefunds?: number;
    pendingPayment: number;
    dueSyncDate?: string;
  };
  salesGraph: { date: string; amount: number; quantity?: number }[];
  recentOrders: Delivery[];
  recentReturns: ReturnOrder[];
  ledger: {
    date: string;
    type: 'delivery' | 'payment' | 'return';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  isFallback?: boolean;
  statusCode?: number;
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalCollected: number;
  netProfit: number;
  totalShopDues: number;
  totalSupplierDues: number;
  totalMaterialCost: number;
  totalOperatingExpense: number;
  sproutsStock: number;
  lowStockAlertsCount: number;
}

export interface ActivityLogItem {
  action: string;
  description: string;
  timestamp: string;
}

export interface ProductionBatch {
  _id: string;
  batchNumber: string;
  grainType?: string;
  grainQuantityKg?: number;
  rawMaterialQty?: number;
  unit?: string;
  rawMaterialName?: string;
  sproutsProducedQty?: number;
  sproutsUnit?: string;
  wasteQty?: number;
  lossPercent?: number;
  soakedDate?: string;
  completionDate?: string;
  yieldPackets?: number;
  sproutType: string;
  status: 'soaking' | 'germinating' | 'ready' | 'dispatched' | 'completed';
  notes?: string;
  createdAt?: string;
}

export interface InventoryItem {
  _id: string;
  itemName: string;
  type: 'raw_material' | 'finished_sprout' | 'finished_sprouts' | 'packaging' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
  valuationPerUnit: number;
  location?: string;
  updatedAt?: string;
}

export interface ItemProcurementSummary {
  itemName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  totalSpent: number;
  avgPrice: number;
  purchaseCount: number;
  lastPurchasedDate: string;
}

export interface InventoryResponseData {
  items: InventoryItem[];
  purchasedMaterials?: Material[];
  procurementStats?: {
    totalProcuredCost: number;
    totalPurchasesCount: number;
    rawBeanCost: number;
    rawBeanQuantity: number;
    packagingCost: number;
    packagingQuantity: number;
    itemWiseSummary: ItemProcurementSummary[];
  };
}

export interface Expense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date?: string;
  expenseDate?: string;
  paymentMethod?: string;
  paidTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavItem {
  name?: string;
  label?: string;
  href: string;
  icon?: any;
}

export interface Product {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  image?: string;
  features?: string[];
}
