// components/mdx/CtaPresetComponent.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { getCtaPreset, type CTAPreset, type LinkItem } from './cta-presets';
import clsx from 'clsx';

interface CtaPresetProps {
  presetKey: string;
  variant?: 'card' | 'minimal' | 'featured';
  className?: string;
}

export function CtaPresetComponent({ presetKey, variant = 'card', className }: CtaPresetProps) {
  const preset = getCtaPreset(presetKey);
  
  if (!preset) {
    console.warn(`CTA preset not found for key: ${presetKey}`);
    return null;
  }

  return (
    <div className={clsx(
      "rounded-lg border bg-white p-6 shadow-sm",
      variant === 'featured' && "ring-2 ring-blue-500",
      className
    )}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{preset.title}</h3>
      {preset.description && (
        <p className="text-gray-600 mb-6">{preset.description}</p>
      )}
      
      <div className="space-y-4">
        {preset.featured && (
          <FeaturedLink item={preset.featured} />
        )}
        
        {preset.actions && (
          <LinkGroup title="Take Action" items={preset.actions} />
        )}
        
        {preset.reads && (
          <LinkGroup title="Read Next" items={preset.reads} />
        )}
        
        {preset.downloads && (
          <LinkGroup title="Downloads" items={preset.downloads} />
        )}
      </div>
    </div>
  );
}

function LinkGroup({ title, items }: { title: string; items: LinkItem[] }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <LinkItemComponent key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

function LinkItemComponent({ item }: { item: LinkItem }) {
  return (
    <Link 
      href={item.href}
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
    >
      {item.icon && (
        <span className="text-lg mt-0.5">{item.icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
            {item.label}
          </span>
          {item.badge && (
            <span className={clsx(
              "px-1.5 py-0.5 text-xs font-medium rounded-full",
              item.badge === 'new' && "bg-green-100 text-green-800",
              item.badge === 'popular' && "bg-blue-100 text-blue-800",
              item.badge === 'featured' && "bg-purple-100 text-purple-800",
              item.badge === 'free' && "bg-orange-100 text-orange-800",
            )}>
              {item.badge}
            </span>
          )}
        </div>
        {item.sub && (
          <p className="text-sm text-gray-600 mt-0.5">{item.sub}</p>
        )}
      </div>
    </Link>
  );
}

function FeaturedLink({ item }: { item: LinkItem }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <Link 
        href={item.href}
        className="block group"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-gray-900 group-hover:text-blue-700">
                {item.label}
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-bold rounded-full">
                Featured
              </span>
            </div>
            {item.sub && (
              <p className="text-gray-600">{item.sub}</p>
            )}
          </div>
          <div className="text-2xl">🚀</div>
        </div>
      </Link>
    </div>
  );
}

export default CtaPresetComponent;