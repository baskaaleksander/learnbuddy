import { UserType, UserRole } from './user.graphql';
import { InferModel } from 'drizzle-orm';
import { users } from '../database/schema';

export type UserDb = InferModel<typeof users>;

export function toUserGraphQL(user: UserDb): UserType {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
