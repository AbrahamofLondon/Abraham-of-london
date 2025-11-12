// pages/api/ws/stocks.ts

import { NextApiRequest } from 'next';
import { WebSocketServer } from 'ws';
import { Server } from 'http';

/* eslint-disable @typescript-eslint/no-explicit-any */

// This would typically be set up with a custom server
// For Next.js API routes, we need to handle WebSocket upgrades

export default function handler(req: NextApiRequest, res: any) {
  // WebSocket connections are handled differently in Next.js
  // This is a placeholder for the WebSocket endpoint
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(426).json({ 
    error: 'WebSocket upgrade required',
    message: 'This endpoint requires WebSocket protocol' 
  });
}

// WebSocket server setup (would be in a custom server file)
export class StockWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connections: Set<any> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/api/ws/stocks' });
    
    this.wss.on('connection', (ws, req) => {
      const symbol = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('symbol');
      
      this.connections.add(ws);
      console.log(`New WebSocket connection for symbol: ${symbol}`);

      // Send initial data
      this.sendStockUpdate(ws, symbol);

      // Set up interval for live updates
      const interval = setInterval(() => {
        this.sendStockUpdate(ws, symbol);
      }, 5000); // Update every 5 seconds

      ws.on('close', () => {
        this.connections.delete(ws);
        clearInterval(interval);
        console.log(`WebSocket connection closed for symbol: ${symbol}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    });
  }

  private sendStockUpdate(ws: any, symbol: string | null) {
    if (!symbol) return;

    const mockUpdate = {
      type: 'price_update',
      data: {
        symbol,
        price: 100 + Math.random() * 200,
        changeAmount: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.1,
        timestamp: new Date().toISOString(),
        volume: Math.floor(Math.random() * 10000000),
      },
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(mockUpdate));
    }
  }

  broadcastToSymbol(symbol: string, data: any) {
    this.connections.forEach(ws => {
      // In a real implementation, you'd filter by symbol subscription
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'price_update',
          data,
          timestamp: new Date().toISOString(),
        }));
      }
    });
  }

  close() {
    this.connections.forEach(ws => ws.close());
    this.wss?.close();
  }
}