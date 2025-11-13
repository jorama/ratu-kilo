import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import { createOrgRoutes } from './routes/orgs';
import { createSourceRoutes } from './routes/sources';
import { createChatRoutes } from './routes/chat';
import { createCouncilRoutes } from './routes/council';
import { createAnalyticsRoutes } from './routes/analytics';
import { createVoiceRoutes } from './routes/voice';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

// =========================
// SERVER CONFIGURATION
// =========================

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =========================
// MIDDLEWARE
// =========================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// =========================
// HEALTH CHECK
// =========================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Ratu Sovereign AI API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs',
  });
});

// =========================
// API ROUTES
// =========================

// Public routes (no auth required)
app.use('/api/v1/orgs', createOrgRoutes());

// Protected routes (auth required)
app.use('/api/v1/orgs/:orgId/sources', authMiddleware, createSourceRoutes());
app.use('/api/v1/orgs/:orgId/chat', authMiddleware, createChatRoutes());
app.use('/api/v1/orgs/:orgId/council', authMiddleware, createCouncilRoutes());
app.use('/api/v1/orgs/:orgId/analytics', authMiddleware, createAnalyticsRoutes());
app.use('/api/v1/orgs/:orgId/voice', authMiddleware, createVoiceRoutes());

// =========================
// ERROR HANDLING
// =========================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// =========================
// WEBSOCKET SERVER
// =========================

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'chat':
          // Handle streaming chat
          ws.send(JSON.stringify({
            type: 'chat_response',
            data: { message: 'Chat streaming not yet implemented' },
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type',
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Ratu Sovereign AI',
    timestamp: Date.now(),
  }));
});

// =========================
// START SERVER
// =========================

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Ratu Sovereign AI API Server');
  console.log('='.repeat(50));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`HTTP Server: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;