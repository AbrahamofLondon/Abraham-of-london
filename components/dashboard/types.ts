// components/dashboard/types.ts
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  volume?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  isFavorite?: boolean;
}

export interface StockDataUpdate {
  type: 'price_update' | 'batch_update' | 'error' | 'connection_status';
  data: StockPrice | StockPrice[] | string;
  timestamp?: string;
}

export interface LiveDataDashboardProps {
  initialSymbols?: string[];
  refreshInterval?: number;
  showConnectionStatus?: boolean;
  maxStocksDisplay?: number;
  onStockSelect?: (symbol: string) => void;
  theme?: 'light' | 'dark';
}

export interface StockPriceCardProps {
  stock: StockPrice;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onClick?: () => void;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatLargeNumber: (value?: number) => string;
  theme?: 'light' | 'dark';
}