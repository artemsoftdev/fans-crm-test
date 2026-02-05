import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async health() {
    const dbStatus =
      this.connection.readyState === 1 ? 'connected' : 'disconnected';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        readyState: this.connection.readyState,
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('health')
  async healthCheck() {
    return this.health();
  }
}
