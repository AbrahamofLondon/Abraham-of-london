'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserPlus, CreditCard, AlertCircle } from 'lucide-react';

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
    console.log('Finalizing Intelligence Clearance...', { eventId, selectedTicket, quantity, formData });
  };

  return (
    <div className="bg-zinc-950 border border-white/10 overflow-hidden">
      <div className="bg-zinc-900/50 p-6 border-b border-white/5">
        <h2 className="text-xl font-serif italic text-white flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          Clearance Application
        </h2>
      </div>
      
      <div className="p-8">
        {maxAttendees && remainingSpots !== undefined && (
          <div className="mb-10">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Available Allotment</span>
              <span className="font-mono text-sm text-amber-500">
                {remainingSpots} / {maxAttendees} Units
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-1">
              <div 
                className="bg-amber-500 h-1 transition-all duration-700 ease-in-out"
                style={{ width: `${(remainingSpots / maxAttendees) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Ticket Options */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Select Tier</h3>
            <div className="space-y-3">
              {ticketOptions.map((ticket) => (
                <button
                  key={ticket.id}
                  disabled={!ticket.available}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`w-full text-left p-4 border transition-all duration-300 relative overflow-hidden ${
                    selectedTicket === ticket.id
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-white/5 bg-zinc-900/30 hover:border-white/20'
                  } ${!ticket.available ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif italic text-white">{ticket.name}</h4>
                        {ticket.earlyBird && (
                          <span className="text-[8px] px-1.5 py-0.5 border border-amber-500/50 text-amber-500 font-bold uppercase tracking-tighter">
                            Early Access
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 font-light">{ticket.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-white">£{ticket.price.toFixed(2)}</div>
                      {!ticket.available && <div className="text-[8px] text-red-500 font-bold uppercase mt-1">Exhausted</div>}
                    </div>
                  </div>
                  {selectedTicket === ticket.id && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500 [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-20" />
                  )}
                </button>
              ))}
            </div>

            {selectedTicketData && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono text-white text-lg">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Aggregate Cost</div>
                    <div className="text-2xl font-serif italic text-amber-500">
                      £{totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
              <UserPlus className="w-3 h-3" /> Delegate Details
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Identity</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/5 px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="Delegate Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Secure Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/5 px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="name@domain.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Requirements / Remarks</label>
                <textarea
                  rows={3}
                  value={formData.dietaryRequirements}
                  onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/5 px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                  placeholder="Dietary or accessibility notes..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedTicket}
              className="group flex items-center justify-between w-full p-4 bg-white text-black hover:bg-amber-500 transition-colors duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <span className="font-bold uppercase tracking-tighter text-lg">Finalise Registration</span>
              <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] text-center">
              Encrypted Transmission Protocol Active
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRegistration;