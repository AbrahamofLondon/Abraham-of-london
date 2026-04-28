// components/admin/EventPriceManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface EventPrice {
  eventId: string;
  verified: number;
  member: number;
  public: number;
  restricted?: number;
  topSecret?: number;
  lastUpdated?: number;
}

interface PriceOverride {
  verified: boolean;
  member: boolean;
  public: boolean;
  restricted: boolean;
  topSecret: boolean;
}

export default function EventPriceManager() {
  const [prices, setPrices] = useState<EventPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Partial<EventPrice>>({});
  const [overrides, setOverrides] = useState<Record<string, PriceOverride>>({});

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing');
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      setPrices(data);
      
      // Track which prices are overridden from the baseline schedule
      const overrideMap: Record<string, PriceOverride> = {};
      data.forEach((event: EventPrice) => {
        // You'll need to track overrides from your API
        // This assumes your API returns override status
        overrideMap[event.eventId] = {
          verified: event.verified > 0, // Adjust logic based on your API
          member: event.member > 0,
          public: event.public > 0,
          restricted: (event.restricted || 0) > 0,
          topSecret: (event.topSecret || 0) > 0,
        };
      });
      setOverrides(overrideMap);
      setError(null);
    } catch (err) {
      setError('Failed to load pricing data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: EventPrice) => {
    setEditingEvent(event.eventId);
    setEditedPrices({
      verified: event.verified,
      member: event.member,
      public: event.public,
      restricted: event.restricted,
      topSecret: event.topSecret,
    });
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setEditedPrices({});
  };

  const handleSave = async (eventId: string) => {
    try {
      setSaving(eventId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...editedPrices,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update prices');
      }

      setSuccess('Prices updated successfully');
      await fetchPrices(); // Refresh data
      setEditingEvent(null);
      setEditedPrices({});
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update prices');
    } finally {
      setSaving(null);
    }
  };

  const handleResetToBaseline = async (eventId: string) => {
    if (!confirm('Reset all prices to baseline values? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(eventId);
      setError(null);
      
      const response = await fetch(`/api/admin/pricing?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset prices');
      }

      setSuccess('Prices reset to baseline values');
      await fetchPrices();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset prices');
    } finally {
      setSaving(null);
    }
  };

  const formatPrice = (price: number) => `£${(price / 100).toFixed(2)}`;
  
  const parsePrice = (value: string) => {
    // Convert £XX.XX to pence
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    return Math.round(num * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Price Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="text-left py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">Event</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">Public</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">Member</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-amber-600">Verified</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-purple-600">Restricted</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-red-600">Top Secret</th>
              <th className="text-right py-4 px-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((event) => (
              <tr 
                key={event.eventId}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
              >
                {editingEvent === event.eventId ? (
                  // Edit Mode
                  <>
                    <td className="py-4 px-4 font-mono text-xs">{event.eventId}</td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        defaultValue={formatPrice(event.public)}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          public: parsePrice(e.target.value)
                        })}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        defaultValue={formatPrice(event.member)}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          member: parsePrice(e.target.value)
                        })}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        defaultValue={formatPrice(event.verified)}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          verified: parsePrice(e.target.value)
                        })}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900 rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        defaultValue={formatPrice(event.restricted || 0)}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          restricted: parsePrice(e.target.value)
                        })}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-900 rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        defaultValue={formatPrice(event.topSecret || 0)}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          topSecret: parsePrice(e.target.value)
                        })}
                        className="w-24 px-2 py-1 text-right bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 rounded text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSave(event.eventId)}
                        disabled={saving === event.eventId}
                        className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50"
                      >
                        {saving === event.eventId ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 text-xs border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  // View Mode
                  <>
                    <td className="py-4 px-4 font-mono text-xs">
                      {event.eventId}
                      {overrides[event.eventId]?.verified && (
                        <span className="ml-2 text-[8px] uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          Override
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-mono">{formatPrice(event.public)}</td>
                    <td className="py-4 px-4 text-right font-mono">{formatPrice(event.member)}</td>
                    <td className="py-4 px-4 text-right font-mono text-amber-600 dark:text-amber-500 font-medium">
                      {formatPrice(event.verified)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-purple-600 dark:text-purple-500">
                      {formatPrice(event.restricted || 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-red-600 dark:text-red-500">
                      {formatPrice(event.topSecret || 0)}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetToBaseline(event.eventId)}
                        className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500"
                      >
                        Reset
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[10px] text-neutral-500 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded"></div>
          <span>Verified tier requires 25% premium over Member</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded"></div>
          <span>Restricted clearance events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span>Top Secret clearance required</span>
        </div>
      </div>
    </div>
  );
}
