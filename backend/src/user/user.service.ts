import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../database/drizzle.module';
import {
  users,
  flashcardProgress,
  quizResults,
  passwordResets,
  subscriptions,
  materials,
  aiOutputs,
  flashcards,
} from '../database/schema';
import { toUserGraphQL } from './graphql/user.mapper';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { BillingService } from '../billing/billing.service';
const scrypt = promisify(_scrypt);

@Injectable()
export class UserService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private redisService: RedisService,
    private billingService: BillingService,
  ) {}

  async getCurrentUser(id: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));

    return toUserGraphQL(user[0]);
  }

  async getAllUsers() {
    const usersList = await this.drizzle.select().from(users);

    return usersList.map((user) => toUserGraphQL(user));
  }

  async getUserById(id: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (user.length === 0) {
      throw new Error('User not found');
    }

    return user[0];
  }

  async deleteAccount(id: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (user.length === 0) {
      throw new Error('User not found');
    }

    await this.billingService.cancelSubscription(id);

    await this.redisService.delete(`auth:me:${id}`);

    await this.drizzle
      .delete(flashcardProgress)
      .where(eq(flashcardProgress.userId, id));

    await this.drizzle.delete(quizResults).where(eq(quizResults.userId, id));

    await this.drizzle
      .delete(passwordResets)
      .where(eq(passwordResets.userId, id));

    await this.drizzle
      .delete(subscriptions)
      .where(eq(subscriptions.userId, id));

    const userMaterials = await this.drizzle
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.userId, id));

    const materialIds = userMaterials.map((m) => m.id);

    if (materialIds.length > 0) {
      const userAiOutputs = await this.drizzle
        .select({ id: aiOutputs.id })
        .from(aiOutputs)
        .where(inArray(aiOutputs.materialId, materialIds));

      const aiOutputIds = userAiOutputs.map((ao) => ao.id);

      if (aiOutputIds.length > 0) {
        await this.drizzle
          .delete(flashcards)
          .where(inArray(flashcards.aiOutputId, aiOutputIds));
      }

      await this.drizzle
        .delete(aiOutputs)
        .where(inArray(aiOutputs.materialId, materialIds));
    }

    await this.drizzle.delete(materials).where(eq(materials.userId, id));

    await this.drizzle.delete(users).where(eq(users.id, id));

    await this.redisService.delete(`auth:me:${id}`);

    return true;
  }

  async updateUser(id: string, email?: string, name?: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const updatedData: Partial<typeof users.$inferInsert> = {};
    if (email) {
      updatedData.email = email;
    }
    if (name) {
      updatedData.firstName = name;
    }

    await this.drizzle.update(users).set(updatedData).where(eq(users.id, id));

    await this.redisService.delete(`auth:me:${id}`);

    return true;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    const [salt] = userData.passwordHash.split('.');

    const hash = (await scrypt(oldPassword, salt, 32)) as Buffer;
    const hashedOldPassword = salt + '.' + hash.toString('hex');

    if (hashedOldPassword !== userData.passwordHash) {
      throw new Error('Old password is incorrect');
    }

    const newSalt = randomBytes(8).toString('hex');
    const newHash = (await scrypt(newPassword, newSalt, 32)) as Buffer;
    const newHashedPassword = newSalt + '.' + newHash.toString('hex');

    await this.drizzle
      .update(users)
      .set({ passwordHash: newHashedPassword })
      .where(eq(users.id, id));

    await this.redisService.delete(`auth:me:${id}`);

    return true;
  }
}
