'use client';

import React, { useState, useMemo } from 'react';
import { ShieldCheck, UserPlus, CreditCard, Loader2, ChevronRight, Lock, AlertTriangle } from 'lucide-react';

export interface TicketOption {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  earlyBird?: boolean;
}

interface EventRegistrationProps {
  event: any; // Receives the full event object
  user?: any;  // Receives user session
}

const EventRegistration: React.FC<EventRegistrationProps> = ({ event, user }) => {
  // Defensive extraction of ticket data
  const ticketOptions: TicketOption[] = event?.tickets || [];
  const eventId = event?.slug || 'unknown';
  const maxAttendees = event?.capacity;
  const remainingSpots = event?.remaining;

  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    requirements: '',
  });

  const selectedTicketData = useMemo(() => 
    ticketOptions.find(t => t.id === selectedTicket), 
  [selectedTicket, ticketOptions]);

  const totalPrice = selectedTicketData ? selectedTicketData.price * quantity : 0;

  // Error State: No tickets found in the Registry
  if (ticketOptions.length === 0) {
    return (
      <div className="p-8 bg-zinc-900/50 border border-red-500/20 rounded-[2rem] text-center">
        <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-3" />
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Registry Alert: No active allotments available for this briefing
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/events/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ticketId: selectedTicket, quantity, formData }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Transmission Error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 hover:border-amber-500/30">
      <div className="bg-zinc-900/80 p-6 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          Clearance Application
        </h2>
        <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
          Ref: {eventId.substring(0, 8).toUpperCase()}
        </div>
      </div>
      
      <div className="p-8 lg:p-10">
        {maxAttendees && remainingSpots !== undefined && (
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="text-zinc-500">Available Allotment</span>
              <span className="font-mono text-amber-500">
                {remainingSpots} / {maxAttendees} <span className="text-zinc-700 ml-1 italic">Units</span>
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-[2px] rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${(remainingSpots / maxAttendees) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-10">
          <div className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4">Step 01. Tier</h3>
            {ticketOptions.map((ticket) => (
              <button
                key={ticket.id}
                disabled={!ticket.available}
                onClick={() => setSelectedTicket(ticket.id)}
                className={`w-full text-left p-5 border transition-all duration-500 group relative overflow-hidden ${
                  selectedTicket === ticket.id
                    ? 'border-amber-500/50 bg-amber-500/[0.04]'
                    : 'border-white/5 bg-zinc-900/20 hover:border-white/20'
                } ${!ticket.available ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className={`font-serif italic text-base ${selectedTicket === ticket.id ? 'text-amber-500' : 'text-white'}`}>
                        {ticket.name}
                      </h4>
                      {ticket.earlyBird && (
                        <span className="text-[7px] px-2 py-0.5 bg-amber-500 text-black font-black uppercase tracking-tighter">Priority</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-mono text-white tracking-tighter">
                    {ticket.price === 0 ? 'COMP' : `£${ticket.price.toFixed(0)}`}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pt-8 border-t border-white/5">
             <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Step 02. Credentials</h3>
            
            <div className="space-y-6">
              <div className="group border-b border-white/5 focus-within:border-amber-500/50 transition-colors">
                <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block">Identity</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent py-3 text-white focus:outline-none placeholder:text-zinc-800 text-sm italic font-serif"
                  placeholder="Delegate Name"
                />
              </div>

              <div className="group border-b border-white/5 focus-within:border-amber-500/50 transition-colors">
                <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block">Secure Channel</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent py-3 text-white focus:outline-none placeholder:text-zinc-800 text-sm font-mono"
                  placeholder="email@registry.org"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedTicket || isSubmitting}
              className="relative group w-full py-5 bg-white text-black hover:bg-amber-500 transition-all duration-500 disabled:opacity-10"
            >
              <div className="relative z-10 flex items-center justify-center gap-3 font-black uppercase tracking-[0.3em] text-[10px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalise Access'}
                {!isSubmitting && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>
            
            <p className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
              <Lock className="w-2.5 h-2.5" /> 256-bit Protocol Active
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EventRegistration;