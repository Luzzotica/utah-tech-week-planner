import React from 'react';
import { Event } from '../types';
import { MapPin, Clock } from 'lucide-react';

interface EventDetailsProps {
  event: Event | null;
  onClose: () => void;
  onToggleSelect: (event: Event) => void;
  isSelected: boolean;
}

export function EventDetails({ event, onClose, onToggleSelect, isSelected }: EventDetailsProps) {
  if (!event) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-2 text-gray-600">
        <Clock size={16} />
        <span>
          {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
          {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {event.location && (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={16} />
          <span>{event.location}</span>
        </div>
      )}

      {event.description && (
        <p className="text-gray-700">{event.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {event.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        onClick={() => onToggleSelect(event)}
        className={`w-full py-2 px-4 rounded-lg transition-colors ${
          isSelected
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isSelected ? 'Remove from My Schedule' : 'Add to My Schedule'}
      </button>
    </div>
  );
}