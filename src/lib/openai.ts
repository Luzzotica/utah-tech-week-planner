import OpenAI from 'openai';
import { Event } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function searchEventsByKeywords(events: Event[], keywords: string[]): Event[] {
  try {
    const lowercaseKeywords = keywords.map(k => k.toLowerCase());
    return events.filter(event => {
      const searchText = `${event.title} ${event.tags.join(' ')}`.toLowerCase();
      return lowercaseKeywords.some(keyword => searchText.includes(keyword));
    });
  } catch (error) {
    console.error('Error in keyword search:', error);
    return events.filter(event => event.isSponsored) || [];
  }
}

// Phase 1: Initial event suggestions based on minimal context
export async function analyzeUserInput(
  input: string,
  events: Event[]
): Promise<{ suggestedEvents: Event[]; response: string }> {
  const fallbackSearch = () => {
    try {
      const keywords = input.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2)
        .filter(word => !['show', 'find', 'about', 'interested', 'events', 'what'].includes(word));
      
      let results = searchEventsByKeywords(events, keywords);
      
      if (results.length === 0) {
        results = events.filter(event => event.isSponsored);
      }
      
      return results;
    } catch (error) {
      console.error('Error in fallback search:', error);
      return events.filter(event => event.isSponsored) || [];
    }
  };

  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return {
      suggestedEvents: fallbackSearch(),
      response: "I'll help you find relevant events based on keywords. Here are some events that might interest you."
    };
  }

  try {
    // Minimal context for initial event suggestions
    const eventsContext = events.map(event => ({
      id: event.id,
      title: event.title,
      tags: event.tags
    }));

    const prompt = `As an event planner for Utah Tech Week, suggest events based on: "${input}"

Events:
${eventsContext.map(e => `${e.id}|${e.title}|${e.tags.join(',')}`).join('\n')}

Return a JSON object with exactly this format:
{
  "suggestedEventIds": ["id1", "id2"],
  "response": "Brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    try {
      // Clean the response string to ensure valid JSON
      const cleanedContent = content.replace(/[\u0000-\u001F]+/g, '').trim();
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in response');
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.suggestedEventIds || !Array.isArray(result.suggestedEventIds) || !result.response) {
        throw new Error('Invalid response structure');
      }

      const suggestedEvents = events.filter(event => 
        result.suggestedEventIds.includes(event.id)
      );

      if (suggestedEvents.length === 0) {
        return {
          suggestedEvents: fallbackSearch(),
          response: "Based on your interests, here are some events you might enjoy. Click on any event to learn more."
        };
      }

      return {
        suggestedEvents,
        response: result.response
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return {
        suggestedEvents: fallbackSearch(),
        response: "I've found some events that might match your interests. Take a look!"
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    const suggestedEvents = fallbackSearch();
    
    return {
      suggestedEvents,
      response: suggestedEvents.length > 0
        ? "I've found some events that might interest you based on your keywords."
        : "I'm showing you our featured events. Feel free to ask about specific topics!"
    };
  }
}

// Phase 2: Detailed analysis of specific events
export async function getEventAnalysis(
  events: Event[],
  userContext: string
): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return "These events match your interests. Click on any event to see full details and add it to your schedule.";
  }

  try {
    const eventsContext = events.map(event => ({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      tags: event.tags
    }));

    const prompt = `Analyze these Utah Tech Week events based on the user's interests: "${userContext}"

Events:
${JSON.stringify(eventsContext, null, 2)}

Provide a concise analysis (2-3 sentences) explaining why these events match their interests and what they might gain from attending.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 250
    });

    return completion.choices[0].message.content || 
      "These events align with your interests. Click on any event to see full details and add it to your schedule.";
  } catch (error) {
    console.error('Error getting event analysis:', error);
    return "These events match your interests. Click on any event to learn more and add it to your schedule.";
  }
}