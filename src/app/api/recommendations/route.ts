import { NextResponse } from 'next/server';
import { getInitialRecommendations } from '@/utils/openai';
import events from '@/data/events.json';
import { EventData } from '@/types';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Step 1: Get initial recommendations based on titles
    const initialIds = await getInitialRecommendations(message, events as EventData[]);
    
    // If no initial matches, return early
    if (initialIds.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Get full details of initially selected events
    // const preSelectedEvents = (events as EventData[]).filter(event => 
    //   initialIds.includes(event.id.toString())
    // );
    // Step 2: Get final recommendations based on full event details
    // const finalIds = await getFinalRecommendations(message, preSelectedEvents);

    return NextResponse.json({ recommendations: initialIds });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 