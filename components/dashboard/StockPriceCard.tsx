// components/dashboard/StockPriceCard.tsx - UPDATED
import { StockPrice } from './types';

interface StockPriceCardProps {
  stock: StockPrice;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onClick: () => void;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatLargeNumber: (value?: number) => string;
  theme: 'light' | 'dark';
}

export const StockPriceCard: React.FC<StockPriceCardProps> = ({
  stock,
  isFavorite,
  onToggleFavorite,
  onClick,
  formatCurrency,
  formatPercent,
  formatLargeNumber,
  theme,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{stock.symbol}</h3>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            ${stock.price.toFixed(2)}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(stock.symbol);
          }}
          className={`p-1 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          aria-label={isFavorite ? `Remove ${stock.symbol} from favorites` : `Add ${stock.symbol} to favorites`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className={`text-2xl font-bold mb-1 ${
        stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {formatCurrency(stock.price)}
      </div>

      <div className={`text-sm font-medium mb-3 ${
        stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} 
        <span className="ml-2">({formatPercent(stock.changePercent)})</span>
      </div>

      <div className={`grid grid-cols-2 gap-2 text-xs ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {stock.volume && (
          <div>
            <div>Volume</div>
            <div className="font-medium">{formatLargeNumber(stock.volume)}</div>
          </div>
        )}
        {stock.marketCap && (
          <div>
            <div>Market Cap</div>
            <div className="font-medium">{formatLargeNumber(stock.marketCap)}</div>
          </div>
        )}
        {stock.high24h && (
          <div>
            <div>24h High</div>
            <div className="font-medium">{formatCurrency(stock.high24h)}</div>
          </div>
        )}
        {stock.low24h && (
          <div>
            <div>24h Low</div>
            <div className="font-medium">{formatCurrency(stock.low24h)}</div>
          </div>
        )}
      </div>

      <div className={`mt-3 text-xs ${
        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
      }`}>
        Updated: {new Date(stock.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
};