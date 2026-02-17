// components/content/DownloadCTA.client.jsx
import * as React from "react";

/**
 * @typedef {import('@/types/download-cta').CTADetail} CTADetail
 * @typedef {import('@/types/download-cta').DownloadCTAProps} DownloadCTAProps
 */

/**
 * @param {DownloadCTAProps} props
 */
export default function DownloadCTA({
  title,
  badge,
  details,
  features,
  steps,
  buttonText,
  onClick,
  href
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 my-12">
      {/* Badge */}
      <div className="inline-block px-3 py-1 mb-4 text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-500 rounded-full">
        {badge}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-serif text-white mb-4">{title}</h3>

      {/* Details Grid */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-white/70">
              <span>{detail.icon}</span>
              <div>
                <div className="text-xs text-white/40">{detail.label}</div>
                <div className="font-medium">{detail.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Features List */}
      {features.length > 0 && (
        <ul className="space-y-2 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-amber-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
            How it works
          </div>
          <ol className="space-y-2">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Download Button */}
      <a
        href={href}
        onClick={onClick}
        className="inline-flex items-center justify-center w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors duration-200"
        target="_blank"
        rel="noopener noreferrer"
      >
        {buttonText}
      </a>
    </div>
  );
}