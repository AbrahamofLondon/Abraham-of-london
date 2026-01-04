'use client';

import React, { useState } from 'react';

interface TicketOption {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  earlyBird?: boolean;
}

interface EventRegistrationProps {
  ticketOptions: TicketOption[];
  eventId: string;
  maxAttendees?: number;
  remainingSpots?: number;
}

const EventRegistration: React.FC<EventRegistrationProps> = ({
  ticketOptions,
  eventId,
  maxAttendees,
  remainingSpots,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    dietaryRequirements: '',
    specialRequests: '',
  });

  const selectedTicketData = ticketOptions.find(t => t.id === selectedTicket);
  const totalPrice = selectedTicketData ? selectedTicketData.price * quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic
    console.log('Registering...', { selectedTicket, quantity, formData });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Now</h2>
      
      {maxAttendees && remainingSpots !== undefined && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Spots available</span>
            <span className="text-sm font-semibold text-blue-600">
              {remainingSpots} / {maxAttendees}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(remainingSpots / maxAttendees) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Ticket</h3>
          <div className="space-y-4">
            {ticketOptions.map((ticket) => (
              <div
                key={ticket.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTicket === ticket.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!ticket.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => ticket.available && setSelectedTicket(ticket.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                      {ticket.earlyBird && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                          Early Bird
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${ticket.price.toFixed(2)}
                    </div>
                    {!ticket.available && (
                      <div className="text-xs text-red-600 mt-1">Sold Out</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedTicketData && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
                <div className="ml-auto">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Requirements
            </label>
            <textarea
              rows={2}
              value={formData.dietaryRequirements}
              onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any allergies or dietary restrictions?"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTicket}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventRegistration;