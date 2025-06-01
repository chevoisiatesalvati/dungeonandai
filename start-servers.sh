#!/bin/bash

# Start the WebSocket server in the background
tsx ws_server.ts &
WS_PID=$!

# Start the Next.js development server with custom server
cd packages/nextjs && node server.js &
NEXT_PID=$!

# Wait for both servers
wait

# When either server is stopped, stop both
kill $WS_PID $NEXT_PID 