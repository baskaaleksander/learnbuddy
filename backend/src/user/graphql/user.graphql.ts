import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  emailVerified: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
