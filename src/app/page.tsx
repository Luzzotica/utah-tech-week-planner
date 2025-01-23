'use client'

import { useState } from 'react'
import Calendar from '@/components/Calendar'
import ChatBot from '@/components/ChatBot'
import events from '@/data/events.json'
import { EventData } from '@/types'
import EmailModal from '@/components/EmailModal'

// Add this helper function at the top of the file, outside the component
function formatDateForICal(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function createICalEvent(event: EventData) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  return `BEGIN:VEVENT
UID:${event.id}@utahtechweek2025
DTSTAMP:${formatDateForICal(new Date())}
DTSTART:${formatDateForICal(startDate)}
DTEND:${formatDateForICal(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.address}
URL:${event.registration_url}
END:VEVENT`;
}

export default function Home() {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set())
  const [recommendedEvents, setRecommendedEvents] = useState<EventData[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event)
  }

  const handleToggleEvent = (event: EventData) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev)
      if (next.has(event.id)) {
        next.delete(event.id)
      } else {
        next.add(event.id)
      }
      return next
    })
  }

  const handleEventsRecommended = (eventIds: string[]) => {
    // Convert new recommendations to EventData objects
    const newEvents = (events as EventData[]).filter(event => 
      eventIds.includes(event.id.toString())
    )
    
    // Replace previous recommendations with new ones
    setRecommendedEvents(newEvents)
  }

  // Combine saved events with current recommendations
  const visibleEvents = [
    // Include saved events
    ...(events as EventData[]).filter(event => selectedEventIds.has(event.id)),
    // Include new recommendations that aren't already saved
    ...recommendedEvents.filter(event => !selectedEventIds.has(event.id))
  ]

  const handleExport = () => {
    setShowEmailModal(true)
  }

  const handleEmailSubmit = async (email: string) => {
    // Submit email to GHL
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit email');
    }

    // Generate and download calendar file
    const selectedEvents = (events as EventData[]).filter(event => selectedEventIds.has(event.id));
    
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Utah Tech Week 2025//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${selectedEvents.map(event => createICalEvent(event)).join('\n')}
END:VCALENDAR`;

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'utah-tech-week-events.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <div className="flex flex-row gap-4 h-[calc(100vh-theme(spacing.8)*2)] w-full">
        {/* Chatbot - Left Column */}
        <div className="flex flex-col w-[320px] h-full">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">Utah Tech Week 2025</h1>
          </div>
          <div className="flex-1 min-h-0">
            <ChatBot onEventsSelected={handleEventsRecommended} />
          </div>
        </div>

        {/* Calendar - Middle Column */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm p-4 flex-1 min-w-0">
            <Calendar 
              selectedEvents={visibleEvents} 
              onEventClick={handleEventClick}
              selectedEventIds={selectedEventIds}
            />
          </div>
        </div>

        {/* Event Detail - Right Column */}
        <div className="flex flex-col w-[400px] h-full">
          <div className="flex-1 min-h-0">
            {selectedEvent ? (
              <div className="bg-white rounded-lg shadow-sm flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900 break-words">
                    {selectedEvent.title}
                  </h2>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Host</div>
                    <div className="text-gray-900">{selectedEvent.host || 'No host specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Time</div>
                    <div className="text-gray-900">
                      {new Date(selectedEvent.start).toLocaleString()} - {new Date(selectedEvent.end).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Location</div>
                    <div className="text-gray-900">{selectedEvent.address}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Description</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
                  <button
                    onClick={() => handleToggleEvent(selectedEvent)}
                    className={`w-full px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      selectedEventIds.has(selectedEvent.id)
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {selectedEventIds.has(selectedEvent.id) ? 'Remove from Calendar' : 'Add to Calendar'}
                  </button>
                  <a
                    href={selectedEvent.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm"
                  >
                    Register for Event
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
                Select an event to view details
              </div>
            )}
          </div>
          
          {selectedEventIds.size > 0 && (
            <div className="mt-4 flex-shrink-0">
              <button
                onClick={handleExport}
                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Export {selectedEventIds.size} Events
              </button>
            </div>
          )}
        </div>
      </div>
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
        eventCount={selectedEventIds.size}
      />
    </>
  )
}
