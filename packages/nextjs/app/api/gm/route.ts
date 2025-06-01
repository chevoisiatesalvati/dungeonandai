import { NextResponse } from 'next/server';
import { chatServer } from '../../../../../ws_server';

export async function POST(request: Request) {
  try {
    const { userInput, locationId } = await request.json();

    if (!userInput) {
      return NextResponse.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    // TODO: Replace this with your actual LLM call
    const gmResponse = `GM response to: ${userInput}`;

    // Broadcast the GM response to all clients in the specific location
    chatServer.broadcastGMMessage(gmResponse, locationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in GM API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 