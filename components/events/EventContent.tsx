import React from 'react';

interface EventDetail {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface EventDetailsProps {
  details: EventDetail[];
  description: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({ details, description }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {details.map((detail, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {detail.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{detail.label}</p>
              <p className="text-lg font-semibold text-gray-900">{detail.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="prose prose-blue max-w-none">
        <h3 className="text-xl font-bold text-gray-900 mb-4">About This Event</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default EventDetails;
