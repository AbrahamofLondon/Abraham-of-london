// components/PDFDashboard/PDFShareModal.tsx
import React, { useState } from 'react';
import { PDFItem } from '@/lib/pdf/types';
import { X, Copy, Mail, Link as LinkIcon, Check } from 'lucide-react';

interface PDFShareModalProps {
  pdf: PDFItem;
  isOpen: boolean;
  onClose: () => void;
  onShare: (options: ShareOptions) => void;
}

interface ShareOptions {
  method: 'link' | 'email';
  recipients?: string[];
  expiresAt?: string;
  permissions: string[];
}

export const PDFShareModal: React.FC<PDFShareModalProps> = ({
  pdf,
  isOpen,
  onClose,
  onShare,
}) => {
  const [method, setMethod] = useState<'link' | 'email'>('link');
  const [recipients, setRecipients] = useState('');
  const [expires, setExpires] = useState('7');
  const [permissions, setPermissions] = useState(['view']);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const token = Math.random().toString(36).substring(2);
    return `${baseUrl}/share/${pdf.id}?token=${token}&expires=${expires}`;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const options: ShareOptions = {
        method,
        permissions,
      };

      if (method === 'email') {
        options.recipients = recipients.split(',').map(r => r.trim());
      }

      if (expires) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expires));
        options.expiresAt = expiryDate.toISOString();
      }

      await onShare(options);

      if (method === 'link') {
        const link = generateShareLink();
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Share "{pdf.title}"</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Share Method */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Share Method
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMethod('link')}
                  className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    method === 'link'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <LinkIcon className="h-5 w-5" />
                  <span className="text-sm">Share Link</span>
                </button>
                <button
                  onClick={() => setMethod('email')}
                  className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    method === 'email'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">Email</span>
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Permissions
              </label>
              <div className="space-y-2">
                {['view', 'comment', 'edit', 'download'].map((perm) => (
                  <label key={perm} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPermissions([...permissions, perm]);
                        } else {
                          setPermissions(permissions.filter(p => p !== perm));
                        }
                      }}
                      className="rounded bg-gray-800 border-gray-700"
                    />
                    <span className="text-sm capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Recipients (conditional) */}
            {method === 'email' && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Recipients
                </label>
                <input
                  type="text"
                  placeholder="Enter emails separated by commas"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Expiration */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Link Expires In
              </label>
              <select
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm"
              >
                <option value="1">1 Day</option>
                <option value="7">1 Week</option>
                <option value="30">1 Month</option>
                <option value="365">1 Year</option>
                <option value="0">Never</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {method === 'link' && (
                <button
                  onClick={() => {
                    const link = generateShareLink();
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy Link</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {sharing ? 'Sharing...' : 'Share PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};