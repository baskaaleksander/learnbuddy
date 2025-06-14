import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { users } from 'src/database/schema';
import { toUserGraphQL } from './user.mapper';

@Injectable()
export class UserService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

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
}
