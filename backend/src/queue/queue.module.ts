import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { setupBullBoard } from '../utils/setupBullBoard';
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  providers: [
    {
      provide: 'BULL_BOARD_CONFIG',
      useFactory: () => setupBullBoard([]),
      inject: [],
    },
  ],
  exports: ['BULL_BOARD_CONFIG'],
})
export class QueueModule {}
