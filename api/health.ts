import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: process.env.DATABASE_URL ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      session: process.env.SESSION_SECRET ? 'configured' : 'not configured'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  res.status(200).json(healthCheck);
}