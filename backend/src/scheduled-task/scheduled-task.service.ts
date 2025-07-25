import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import { Logger } from 'nestjs-pino';
import { db } from '../database/drizzle.module';
import { scheduledJobs, users } from '../database/schema';

@Injectable()
export class ScheduledTaskService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledTasks() {
    const now = new Date();

    const tasks = await this.drizzle
      .select()
      .from(scheduledJobs)
      .where(
        and(
          lte(scheduledJobs.executeAt, now),
          eq(scheduledJobs.isExecuted, false),
        ),
      );

    this.logger.log(`Found ${tasks.length} scheduled tasks to execute`);

    for (const task of tasks) {
      if (task.type === 'reset-tokens') {
        await this.handleResetTokens(task.userId);
        await this.drizzle
          .update(scheduledJobs)
          .set({ isExecuted: true })
          .where(eq(scheduledJobs.id, task.id));
      }
      await this.drizzle.insert(scheduledJobs).values({
        userId: task.userId,
        type: task.type,
        executeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isExecuted: false,
      });
    }
  }

  async scheduleTask(userId: string, type: string, execute_at: Date) {
    await this.drizzle.insert(scheduledJobs).values({
      userId,
      type,
      executeAt: execute_at,
    });

    this.logger.log(`Scheduled task of type ${type} for user ${userId}`);
  }

  async destroyTask(userId: string, type: string) {
    const task = await this.drizzle
      .select()
      .from(scheduledJobs)
      .where(
        and(eq(scheduledJobs.userId, userId), eq(scheduledJobs.type, type)),
      );

    if (task.length === 0) {
      this.logger.warn(`No task found for user ${userId} of type ${type}`);
      return;
    }

    await this.drizzle
      .delete(scheduledJobs)
      .where(
        and(eq(scheduledJobs.userId, userId), eq(scheduledJobs.type, type)),
      );

    this.logger.log(`Destroyed task of type ${type} for user ${userId}`);
  }

  async handleResetTokens(userId: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      this.logger.warn(`User ${userId} not found for token reset`);
      return;
    }

    await this.drizzle
      .update(users)
      .set({ tokensUsed: 0 })
      .where(eq(users.id, userId));

    this.logger.log('Tokens reset for user:', userId);
  }
}
