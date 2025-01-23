'use client'

import { useState, useRef, useEffect } from 'react'
import events from '@/data/events.json'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { EventData } from '@/types';
interface ChatBotProps {
  onEventsSelected: (eventIds: string[]) => void;
}

function generateResponse(recommendedEvents: EventData[]): string {
  if (recommendedEvents.length === 0) {
    return "I couldn't find any events matching your criteria. Could you try being more specific or try different keywords?";
  }

  // Group events by day
  const eventsByDay = recommendedEvents.reduce((acc, event) => {
    const day = new Date(event.start).toLocaleDateString('en-US', { weekday: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, EventData[]>);

  // Generate summary
  let response = `I found ${recommendedEvents.length} event${recommendedEvents.length > 1 ? 's' : ''} that might interest you:\n\n`;

  Object.entries(eventsByDay).forEach(([day, events]) => {
    response += `${day}:\n`;
    events.forEach(event => {
      const time = new Date(event.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      response += `• ${event.title} at ${time}\n`;
    });
    response += '\n';
  });

  response += "I've added these events to the calendar for you to review. Let me know if you'd like to see different events or have any questions!";

  return response;
}

export default function ChatBot({ onEventsSelected }: ChatBotProps) {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    events?: string[]
  }>>([
    {
      role: 'assistant',
      content: 'Hi! I can help you find events that match your interests. You can ask about specific days or topics - for example, "AI events on Monday" or "networking events on Tuesday afternoon". What kind of events are you looking for?'
    }
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Add ref for messages container
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || 'Failed to get recommendations');
      }
      
      const recommendedEventIds = data.recommendations;
      onEventsSelected(recommendedEventIds);

      // Get full event details for recommended events
      const recommendedEvents = (events as EventData[])
        .filter(event => recommendedEventIds.includes(event.id.toString()));

      // Generate dynamic response
      const responseMessage = generateResponse(recommendedEvents);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseMessage
      }]);
    } catch (error) {
      console.error('Error getting recommendations:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
      onEventsSelected([]);
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessage = (message: typeof messages[0]) => {
    return (
      <>
        <div className={`${
          message.role === 'assistant'
            ? 'bg-gray-100 text-gray-900'
            : 'bg-blue-600 text-white ml-auto'
        } p-4 rounded-lg max-w-[80%] shadow-sm whitespace-pre-line`}>
          {message.content}
        </div>
        {message.events && (
          <div className="mt-2 space-y-2">
            {message.events.map(eventId => {
              const event = events.find(e => e.id.toString() === eventId)
              if (!event) return null
              return (
                <div 
                  key={event.id}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.start} - {event.end}</p>
                  <p className="text-sm text-gray-600">{event.address}</p>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col border border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h2 className="font-semibold text-gray-900">Event Planning Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div key={i}>
            {renderMessage(message)}
          </div>
        ))}
        {/* Add invisible div for scrolling */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about events..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex-shrink-0"
            title={isLoading ? 'Thinking...' : 'Send message'}
          >
            <PaperAirplaneIcon className={`w-5 h-5 ${isLoading ? 'opacity-50' : ''}`} />
          </button>
        </div>
      </form>
    </div>
  )
}