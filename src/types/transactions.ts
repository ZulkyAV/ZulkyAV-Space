export type TransactionProduct = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  isActive: boolean;
};

export type RecentSale = {
  id: string;
  soldAt: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
};

