import OpenAI from 'openai';
import { config } from './config';
import { EventData } from '@/types';

export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function getInitialRecommendations(userMessage: string, events: EventData[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are an event planning assistant for Utah Tech Week 2025. 
        Your job is to help users find events that match their interests based on event titles and dates.
        Users might ask for events on specific days or with specific topics.
        Respond with the IDs of all relevant events (be very generous with this), separated by commas.
        Only respond with event IDs, nothing else.`
      },
      {
        role: "user",
        content: `Available events: ${JSON.stringify(events.map(e => ({
          id: e.id,
          title: e.title,
          host: e.host,
          date: new Date(e.start).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'numeric',
            day: 'numeric'
          }),
          time: new Date(e.start).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric'
          })
        })))}
        User request: ${userMessage}
        Remember to only respond with relevant event IDs, comma-separated.`
      }
    ],
    temperature: 0.7,
    max_tokens: 150
  });

  const eventIds = response.choices[0].message.content?.split(',').map(id => id.trim()) || [];
  return eventIds;
}

export async function getFinalRecommendations(userMessage: string, preSelectedEvents: EventData[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an event planning assistant for Utah Tech Week 2025. 
        Your job is to help users find the most relevant events from a pre-filtered list.
        Analyze the event descriptions carefully and return only the most relevant events.
        Respond with the IDs of the final selected events, separated by commas.
        Only respond with event IDs, nothing else.`
      },
      {
        role: "user",
        content: `User is looking for: ${userMessage}
        
        Pre-selected events: ${JSON.stringify(preSelectedEvents)}
        
        Return only the most relevant event IDs as a comma-separated list.`
      }
    ],
    temperature: 0.5,
    max_tokens: 150
  });

  const eventIds = response.choices[0].message.content?.split(',').map(id => id.trim()) || [];
  return eventIds;
} 