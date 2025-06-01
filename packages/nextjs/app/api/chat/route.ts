import { NextRequest, NextResponse } from 'next/server';
import { GM_Response } from '../../../../../dnagent_gm';

// Store the last processed message for each user to prevent duplicate GM responses
const lastProcessedMessages = new Map<string, string>();

// Helper function to validate request
function validateRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const isGMResponse = request.headers.get('x-is-gm-response') === 'true';
  const isUserMessage = request.headers.get('x-is-user-message') === 'true';

  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!isGMResponse && !isUserMessage) {
    return { error: 'Invalid request type', status: 400 };
  }

  return { userId, isGMResponse, isUserMessage };
}

export async function POST(request: NextRequest) {
  console.log('Chat API Request:', {
    path: request.nextUrl.pathname,
    headers: Object.fromEntries(request.headers.entries())
  });

  const validation = validateRequest(request);
  if ('error' in validation) {
    return new NextResponse(validation.error, { status: validation.status });
  }

  const { userId, isGMResponse, isUserMessage } = validation;

  try {
    const body = await request.json();
    const { message, locationId, isAction } = body;

    console.log('Chat API Body:', { message, locationId, isAction });

    if (!message || !locationId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Handle GM response
    if (isGMResponse) {
      // Check if this message was already processed
      const lastMessage = lastProcessedMessages.get(userId);
      if (lastMessage === message) {
        return new NextResponse('Message already processed', { status: 400 });
      }

      // Handle GM response
      const gmResponse = await GM_Response(message);
      
      // Store the processed message
      lastProcessedMessages.set(userId, message);
      
      return NextResponse.json({
        type: 'message',
        content: gmResponse,
        sender: 'GM',
        senderId: 'gm',
        isAction: false,
        locationId,
        isGMResponse: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle user message
    if (isUserMessage) {
      // Clear the last processed message when a new user message arrives
      lastProcessedMessages.delete(userId);

      return NextResponse.json({
        type: 'message',
        content: message,
        sender: userId,
        senderId: userId,
        isAction: isAction || false,
        locationId,
        isGMResponse: false,
        timestamp: new Date().toISOString()
      });
    }

    return new NextResponse('Invalid request type', { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 