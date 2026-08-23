export type StatisticsPeriod = "Today" | "7 Days" | "30 Days" | "Current Month";

export type StatisticsSnapshot = {
  period: StatisticsPeriod;
  bars: number[];
  saleCount: number;
  revenue: number;
  itemCount: number;
  bestSeller: string;
  bestSellerQuantity: number;
  recommended: string;
  recommendedStock: "In stock" | "Low stock" | "Sold out";
};

export type PublicStatisticsSettings = {
  isPublic: boolean;
  showBestSeller: boolean;
  showRecommended: boolean;
  maskExactValues: boolean;
};

