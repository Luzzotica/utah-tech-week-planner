import { EventData, Event } from '../types';

// Default events as fallback
const DEFAULT_EVENTS: Event[] = [
  {
    id: 'default-1',
    title: 'Utah Tech Week 2025',
    start: new Date(2025, 0, 27, 9, 0),
    end: new Date(2025, 0, 27, 17, 0),
    description: 'Join us for Utah Tech Week 2025!',
    location: 'Salt Lake City',
    tags: ['conference', 'networking'],
    isSponsored: true
  }
];

export function parseEvents(data: EventData[]): Event[] {
  try {
    return data.map(event => ({
      id: event.id.toString(),
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end), 
      description: event.description,
      location: event.address,
      tags: ['tech', 'networking'],
      registrationUrl: event.registration_url,
      isSponsored: true
    }));
  } catch (error) {
    console.error('Error parsing events:', error);
    return DEFAULT_EVENTS;
  }
}

let allEvents: Event[] = DEFAULT_EVENTS;
let sponsoredEvents: Event[] = DEFAULT_EVENTS;

try {
  // Dynamic import to handle potential missing file
  const eventsModule = await import('../data/events.json');
  const parsedEvents = parseEvents(eventsModule.default as EventData[]);
  
  if (parsedEvents.length > 0) {
    allEvents = parsedEvents;
    sponsoredEvents = parsedEvents.filter(event => event.isSponsored);
  }
} catch (error) {
  console.error('Error loading events:', error);
}

export const ALL_EVENTS = allEvents;
export const SPONSORED_EVENTS = sponsoredEvents;