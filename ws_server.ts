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
}

interface ChatClient {
  id: string;
  name: string;
  ws: WebSocket;
}

class ChatServer {
  private wss: WebSocketServer;
  private clients: Map<string, ChatClient> = new Map();
  private wsMap: Map<string, WebSocket> = new Map(); // Map clientId to ws

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
        this.handleJoin(clientId, data.name);
        break;
      case 'message':
        this.handleChatMessage(clientId, data.content);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleJoin(clientId: string, name: string) {
    const ws = this.wsMap.get(clientId);
    if (!ws) return;
    const client: ChatClient = {
      id: clientId,
      name,
      ws,
    };

    this.clients.set(clientId, client);

    // Notify all clients about the new user
    const joinMessage: ChatMessage = {
      id: uuidv4(),
      type: 'join',
      sender: name,
      senderId: clientId,
      content: `${name} has joined the chat`,
      timestamp: new Date(),
    };

    this.broadcast(joinMessage);
  }

  private handleChatMessage(clientId: string, content: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const message: ChatMessage = {
      id: uuidv4(),
      type: 'message',
      sender: client.name,
      senderId: clientId,
      content,
      timestamp: new Date(),
    };

    this.broadcast(message);
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);

    const leaveMessage: ChatMessage = {
      id: uuidv4(),
      type: 'leave',
      sender: client.name,
      senderId: clientId,
      content: `${client.name} has left the chat`,
      timestamp: new Date(),
    };

    this.broadcast(leaveMessage);
  }

  private broadcast(message: ChatMessage) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }
}

// Create and start the server
const server = createServer();
const chatServer = new ChatServer(server);

const PORT = 3030;
const HOST = '0.0.0.0';  // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server is running on ${HOST}:${PORT}`);
});

export default ChatServer; 