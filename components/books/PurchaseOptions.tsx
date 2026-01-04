'use client';

import React, { useState } from 'react';

interface PurchaseOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

interface PurchaseOptionsProps {
  bookId: string;
  options: PurchaseOption[];
}

const PurchaseOptions: React.FC<PurchaseOptionsProps> = ({ bookId, options }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handlePurchase = (optionId: string) => {
    // Handle purchase logic
    console.log('Purchasing option:', optionId);
    // Redirect to checkout or show modal
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
      <div className="text-center mb-8">
        <ShoppingCartIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Copy</h2>
        <p className="text-gray-600">Choose your preferred format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {options.map((option) => (
          <div
            key={option.id}
            className={`relative bg-white rounded-xl p-6 border-2 transition-all ${
              selectedOption === option.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            } ${option.isPopular ? 'shadow-lg' : ''}`}
          >
            {option.isPopular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="px-4 py-1 bg-yellow-500 text-yellow-900 text-sm font-bold rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ${option.price.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handlePurchase(option.id)}
              className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                option.isPopular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {option.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-blue-200 pt-6">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <ShieldIcon className="w-4 h-4 mr-2" />
          <span>Secure checkout • 30-day money-back guarantee</span>
        </div>
      </div>
    </div>
  );
};

const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default PurchaseOptions;