'use client'

import React from 'react'
import { EventData } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DATES = ['27/1', '28/1', '29/1', '30/1', '31/1', '1/2']
const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am to 5pm

interface CalendarProps {
  selectedEvents: EventData[];
  onEventClick: (event: EventData) => void;
  selectedEventIds: Set<number>;
}

export default function Calendar({ selectedEvents, onEventClick, selectedEventIds }: CalendarProps) {
  // Helper function to calculate event height and position
  const getEventStyle = (event: EventData, columnOffset: number = 0, totalColumns: number = 1) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const height = `${durationHours * 4}rem`;
    
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const hoursSince7am = (startHour - 7) + (startMinutes / 60);
    const top = `${hoursSince7am * 4}rem`;
    
    // Calculate width and offset for overlapping events
    const width = `${90 / totalColumns}%`;
    const left = `${5 + (columnOffset * (90 / totalColumns))}%`;
    
    return {
      height,
      top,
      position: 'absolute' as const,
      width,
      left,
    };
  };

  // Function to detect overlapping events and arrange them
  const arrangeEvents = (events: EventData[]) => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const columns: EventData[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      
      // Find first column where event doesn't overlap
      let columnIndex = 0;
      let placed = false;
      
      while (!placed) {
        const column = columns[columnIndex];
        if (!column) {
          columns[columnIndex] = [event];
          placed = true;
        } else {
          const hasOverlap = column.some(existingEvent => {
            const existingStart = new Date(existingEvent.start).getTime();
            const existingEnd = new Date(existingEvent.end).getTime();
            return !(eventEnd <= existingStart || eventStart >= existingEnd);
          });
          
          if (!hasOverlap) {
            column.push(event);
            placed = true;
          } else {
            columnIndex++;
          }
        }
      }
    });
    
    return columns;
  };

  return (
    <div className="w-full overflow-auto h-full">
      <div className="min-w-[800px] w-full">
        <div className="grid grid-cols-[80px_repeat(6,1fr)] mb-4">
          {/* Header row */}
          <div className="text-sm font-medium text-gray-500 p-2">Time</div>
          {DAYS.map((day, i) => (
            <div key={day} className="text-sm font-medium text-gray-900 p-2 text-center">
              {day} {DATES[i]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[80px_repeat(6,1fr)] relative">
          {/* Time column */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={`time-${hour}`} className="h-16 border-t border-gray-100 relative">
                <span className="absolute -top-3 left-2 text-sm text-gray-500">
                  {hour % 12 || 12}{hour >= 12 ? 'pm' : 'am'}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIndex) => (
            <div key={`day-${dayIndex}`} className="relative">
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div key={`grid-${dayIndex}-${hour}`} className="h-16 border-t border-gray-100" />
              ))}
              
              {/* Events */}
              {(() => {
                const dayEvents = selectedEvents.filter(event => {
                  const eventDate = new Date(event.start);
                  return eventDate.getDay() === dayIndex + 1;
                });
                
                const columns = arrangeEvents(dayEvents);
                
                return columns.map((column, columnIndex) => 
                  column.map(event => (
                    <div
                      key={`event-${dayIndex}-${event.id}`}
                      style={getEventStyle(event, columnIndex, columns.length)}
                      className={`rounded-lg p-2 cursor-pointer transition-colors overflow-hidden border-2 ${
                        selectedEventIds.has(event.id)
                          ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-800'
                          : 'bg-blue-100 hover:bg-blue-200 border-blue-300'
                      }`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className={`text-sm font-medium break-words ${
                        selectedEventIds.has(event.id) 
                          ? 'text-white' 
                          : 'text-blue-900'
                      }`}>
                        {event.title}
                      </div>
                      <div className={`text-xs truncate mt-1 ${
                        selectedEventIds.has(event.id)
                          ? 'text-blue-100'
                          : 'text-blue-700'
                      }`}>
                        {new Date(event.start).toLocaleTimeString([], { 
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}