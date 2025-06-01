import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

interface ChatMessage {
  id: string;
  type: 'message' | 'join' | 'leave';
  sender: string;
  senderId: string;
  content: string;
  timestamp: Date;
  locationId?: string;
  isAction?: boolean;
}

interface ChatClient {
  id: string;
  name: string;
  ws: WebSocket;
  locationId?: string;
}

class ChatServer {
  private wss: WebSocketServer;
  private clients: Map<string, ChatClient> = new Map();
  private wsMap: Map<string, WebSocket> = new Map(); // Map clientId to ws
  private locationRooms: Map<string, Set<string>> = new Map(); // Map locationId to set of clientIds

  constructor(server: ReturnType<typeof createServer>) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      this.wsMap.set(clientId, ws);
      console.log(`New client connected: ${clientId}`);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
        this.wsMap.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, data: any) {
    switch (data.type) {
      case 'join':
        this.handleJoin(clientId, data.name, data.locationId);
        break;
      case 'message':
        this.handleChatMessage(clientId, data.content, data.isAction);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleJoin(clientId: string, name: string, locationId?: string) {
    const ws = this.wsMap.get(clientId);
    if (!ws) return;

    const client: ChatClient = {
      id: clientId,
      name,
      ws,
      locationId,
    };

    this.clients.set(clientId, client);

    // Add client to location room if specified
    if (locationId) {
      if (!this.locationRooms.has(locationId)) {
        this.locationRooms.set(locationId, new Set());
      }
      this.locationRooms.get(locationId)?.add(clientId);
    }

    // Notify all clients in the same location about the new user
    const joinMessage: ChatMessage = {
      id: uuidv4(),
      type: 'join',
      sender: name,
      senderId: clientId,
      content: `${name} has joined the chat`,
      timestamp: new Date(),
      locationId,
    };

    this.broadcastToLocation(joinMessage, locationId);
  }

  private handleChatMessage(clientId: string, content: string, isAction?: boolean) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Broadcast user message to the same location
    const message: ChatMessage = {
      id: uuidv4(),
      type: 'message',
      sender: client.name,
      senderId: clientId,
      content,
      timestamp: new Date(),
      locationId: client.locationId,
      isAction,
    };

    this.broadcastToLocation(message, client.locationId);
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove client from location room
    if (client.locationId) {
      this.locationRooms.get(client.locationId)?.delete(clientId);
      if (this.locationRooms.get(client.locationId)?.size === 0) {
        this.locationRooms.delete(client.locationId);
      }
    }

    this.clients.delete(clientId);

    const leaveMessage: ChatMessage = {
      id: uuidv4(),
      type: 'leave',
      sender: client.name,
      senderId: clientId,
      content: `${client.name} has left the chat`,
      timestamp: new Date(),
      locationId: client.locationId,
    };

    this.broadcastToLocation(leaveMessage, client.locationId);
  }

  // New method to broadcast GM messages to a specific location
  public broadcastGMMessage(content: string, locationId?: string) {
    const message: ChatMessage = {
      id: uuidv4(),
      type: 'message',
      sender: 'GM',
      senderId: 'gm',
      content,
      timestamp: new Date(),
      locationId,
    };

    this.broadcastToLocation(message, locationId);
  }

  private broadcastToLocation(message: ChatMessage, locationId?: string) {
    const messageStr = JSON.stringify(message);
    
    if (locationId) {
      // Broadcast to all clients in the specific location
      const roomClients = this.locationRooms.get(locationId);
      if (roomClients) {
        roomClients.forEach(clientId => {
          const client = this.clients.get(clientId);
          if (client?.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageStr);
          }
        });
      }
    } else {
      // Broadcast to all clients if no location specified
      this.clients.forEach(client => {
        if (client.ws && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(messageStr);
        }
      });
    }
  }
}

// Create and start the server
const server = createServer();
const chatServer = new ChatServer(server);

// Export the chatServer instance so it can be used by the GM API
export { chatServer };

const PORT = 3030;
const HOST = '0.0.0.0';  // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server is running on ${HOST}:${PORT}`);
});

export default ChatServer; 