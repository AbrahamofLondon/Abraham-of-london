'use client';

import React, { useState } from 'react';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  shareUrl: string;
}

interface ShortShareProps {
  shortId: string;
  title: string;
  url: string;
  platforms: SocialPlatform[];
}

const ShortShare: React.FC<ShortShareProps> = ({ shortId, title, url, platforms }) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [shareMessage, setShareMessage] = useState(
    `Check out this short video: "${title}"`
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailShare = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Check out: ${title}`;
    const body = `${shareMessage}\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const generateQRCode = () => {
    // In a real app, you would generate a QR code here
    console.log('Generating QR code for:', url);
  };

  const embedCode = `<iframe src="${url}/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <ShareIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share this Short</h2>
        <p className="text-gray-600">Spread the knowledge with your network</p>
      </div>

      {/* Social Sharing */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <a
              key={platform.id}
              href={platform.shareUrl.replace('{url}', encodeURIComponent(url)).replace('{title}', encodeURIComponent(title))}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center p-4 rounded-xl transition-all ${platform.color} hover:opacity-90`}
            >
              <div className="w-10 h-10 mb-3">
                {platform.icon}
              </div>
              <span className="font-semibold text-white">{platform.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Copy Link */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Copy Link</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={url}
              readOnly
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
            />
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-6 py-3 font-medium rounded-lg transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Email Share */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share via Email</h3>
        <form onSubmit={handleEmailShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Message
            </label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Open Email Client
          </button>
        </form>
      </div>

      {/* Embed & QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed Code</h3>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Copy Embed Code
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-8 flex flex-col items-center">
            <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center mb-4">
              {/* QR Code placeholder */}
              <QrCodeIcon className="w-24 h-24 text-gray-400" />
            </div>
            <button
              onClick={generateQRCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

export default ShortShare;