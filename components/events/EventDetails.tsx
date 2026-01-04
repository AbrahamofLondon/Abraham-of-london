import React from 'react'
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface EventDetailsProps {
  title: string
  description: string
  date: string
  time?: string
  endDate?: string
  location?: string
  virtualLink?: string
  registrationUrl?: string
  registrationRequired?: boolean
  capacity?: number
  accessLevel?: 'public' | 'private' | 'invite-only'
  className?: string
}

const EventDetails: React.FC<EventDetailsProps> = ({
  title,
  description,
  date,
  time,
  endDate,
  location,
  virtualLink,
  registrationUrl,
  registrationRequired = false,
  capacity,
  accessLevel = 'public',
  className = ''
}) => {
  const isPast = new Date(date) < new Date()
  const isVirtual = !!virtualLink
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-slate-300">{description}</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isPast
              ? 'bg-slate-700 text-slate-300'
              : accessLevel === 'private'
              ? 'bg-amber-900/50 text-amber-100 border border-amber-700'
              : 'bg-emerald-900/50 text-emerald-100 border border-emerald-700'
          }`}>
            {isPast ? 'Past Event' : accessLevel === 'public' ? 'Public Event' : 'Private Event'}
          </div>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="p-8 grid md:grid-cols-2 gap-8">
        {/* Left Column - Event Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-900">
                    {new Date(date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {endDate && (
                    <div className="text-sm text-slate-600">
                      to {new Date(endDate).toLocaleDateString('en-GB', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {time && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <span className="font-medium text-slate-900">{time}</span>
                </div>
              )}
              
              {location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">{location}</div>
                    {isVirtual && (
                      <div className="text-sm text-slate-600 mt-1">Virtual option available</div>
                    )}
                  </div>
                </div>
              )}
              
              {capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="font-medium text-slate-900">Capacity: {capacity} attendees</div>
                    <div className="text-sm text-slate-600">Limited spots available</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
            <div className="prose text-slate-700">
              {description}
            </div>
          </div>
        </div>
        
        {/* Right Column - Registration */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Registration</h3>
            
            {isPast ? (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-2">This event has ended</div>
                <div className="text-sm text-slate-600">
                  Check back for future events
                </div>
              </div>
            ) : registrationRequired ? (
              <div className="space-y-4">
                <div className="text-slate-700">
                  Registration is required to attend this event.
                  {capacity && ` Limited to ${capacity} attendees.`}
                </div>
                
                {registrationUrl ? (
                  <Link
                    href={registrationUrl}
                    className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    target="_blank"
                  >
                    Register Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <button className="w-full py-3 px-6 bg-slate-200 text-slate-700 font-medium rounded-lg cursor-not-allowed">
                    Registration Coming Soon
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-slate-700">
                  No registration required. Join us at the scheduled time.
                </div>
                
                {virtualLink && (
                  <Link
                    href={virtualLink}
                    className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
                    target="_blank"
                  >
                    Join Virtual Session
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                )}
              </div>
            )}
            
            {accessLevel === 'private' && !isPast && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-semibold text-amber-800">Private Event</span>
                </div>
                <p className="text-sm text-amber-700">
                  This is a private event. Attendance is by invitation only.
                </p>
              </div>
            )}
          </div>
          
          {/* Virtual Access */}
          {isVirtual && !isPast && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Virtual Access</h4>
              <p className="text-sm text-blue-700 mb-4">
                Can't attend in person? Join us virtually from anywhere in the world.
              </p>
              {virtualLink && (
                <div className="space-y-2">
                  <div className="text-xs text-blue-600 font-medium">Meeting Link:</div>
                  <div className="text-sm font-mono text-blue-800 bg-blue-100 p-2 rounded break-all">
                    {virtualLink}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Share */}
          <div className="text-center pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600 mb-3">Share this event</div>
            <div className="flex justify-center gap-3">
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </button>
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </button>
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 0v24h24v-24h-24zm6 20h-2v-8.5h2v8.5zm-1-9.688c-.594 0-1.078-.484-1.078-1.078s.484-1.078 1.078-1.078c.594 0 1.063.484 1.063 1.078s-.469 1.078-1.063 1.078zm9 9.688h-2v-4.969c0-1.219-.5-2.031-1.5-2.031s-1.656.875-1.656 2.219v4.781h-2v-8.5h2v1.125c.406-.75 1.375-1.375 2.781-1.375 2 0 3.375 1.281 3.375 4v4.75z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetails