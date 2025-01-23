import { NextResponse } from 'next/server';

if (!process.env.GHL_API_KEY) {
  throw new Error('GHL_API_KEY is not defined in environment variables');
}

if (!process.env.GHL_LOCATION_ID) {
  throw new Error('GHL_LOCATION_ID is not defined in environment variables');
}

const GHL_BASE_URL = 'https://services.leadconnectorhq.com/contacts';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Search for existing contact with email filter
    const searchResponse = await fetch(`${GHL_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        locationId: process.env.GHL_LOCATION_ID,
        filters: [
          {
            field: 'email',
            operator: 'eq',
            value: email
          }
        ],
        page: 1,
        pageLimit: 1
      })
    });

    if (!searchResponse.ok) {
      console.error('GHL Search Error:', await searchResponse.json());
      throw new Error('Failed to search for contact');
    }

    const searchData = await searchResponse.json();
    let contactId = searchData.contacts?.[0]?.id;
    let tags = searchData.contacts?.[0]?.tags;

    if (!contactId) {
      // Contact doesn't exist, create new one
      const createResponse = await fetch(`${GHL_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          tags: ['Utah Tech Week 2025'],
          source: 'Calendar Export',
          locationId: process.env.GHL_LOCATION_ID
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('GHL Create Error:', errorData);
        throw new Error('Failed to create contact');
      }

      const createData = await createResponse.json();
      contactId = createData.contact?.id;
    } else {
      // Contact exists, update tags
      const updateResponse = await fetch(`${GHL_BASE_URL}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tags: [...tags, 'Utah Tech Week 2025'],
        }),
      });

      if (!updateResponse.ok) {
        console.error('GHL Update Error:', await updateResponse.json());
        throw new Error('Failed to update contact');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling contact:', error);
    return NextResponse.json(
      { error: 'Failed to process contact' },
      { status: 500 }
    );
  }
}