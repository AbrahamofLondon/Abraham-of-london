import React from 'react';

interface DashboardStatsProps {
  stats: {
    total: number;
    available: number;
    missing: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="mt-6 pt-6 border-t border-white/5">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg bg-gray-900/30 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">Total PDFs</div>
          <div className="text-lg font-bold text-white">{stats.total}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-900/30 border border-gray-800">
          <div className="text-xs text-gray-400 mb-1">On Disk</div>
          <div className="text-lg font-bold text-emerald-400">{stats.available}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
