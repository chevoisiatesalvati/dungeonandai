import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Store the last message timestamp for each user
const lastMessageTimestamps = new Map<string, number>();
// Store the last GM response timestamp for each user
const lastGMResponseTimestamps = new Map<string, number>();
// Store pending GM responses for each user
const pendingGMResponses = new Map<string, boolean>();

export function chatMiddleware(request: NextRequest) {
  // Only apply to chat-related endpoints
  if (!request.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next();
  }

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = Date.now();
  const lastMessageTime = lastMessageTimestamps.get(userId) || 0;
  const lastGMResponseTime = lastGMResponseTimestamps.get(userId) || 0;
  const hasPendingGMResponse = pendingGMResponses.get(userId) || false;

  // Check if this is a GM response request
  const isGMResponse = request.nextUrl.pathname.includes('/gm');

  if (isGMResponse) {
    // Prevent multiple GM responses
    if (hasPendingGMResponse) {
      return new NextResponse('GM response already pending', { status: 429 });
    }

    // Ensure GM response only happens after a user message
    if (now - lastMessageTime > 30000) { // 30 second timeout
      return new NextResponse('No recent user message found', { status: 400 });
    }

    // Mark GM response as pending
    pendingGMResponses.set(userId, true);
    lastGMResponseTimestamps.set(userId, now);

    // Create a modified request with GM response flag
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-is-gm-response', 'true');

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Clear pending status after response
    response.on('end', () => {
      pendingGMResponses.delete(userId);
    });

    return response;
  } else {
    // This is a user message
    // Prevent sending messages too quickly
    if (now - lastMessageTime < 1000) { // 1 second cooldown
      return new NextResponse('Message rate limit exceeded', { status: 429 });
    }

    // Update last message timestamp
    lastMessageTimestamps.set(userId, now);

    // Create a modified request with user message flag
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-is-user-message', 'true');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
} 