import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserType } from './graphql/user.graphql';
import { UserService } from './user.service';
import { CurrentUser } from '../decorators/gql-current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { PayloadDto } from '../auth/dtos/payload.dto';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user: PayloadDto) {
    return this.userService.getCurrentUser(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteAccount(@CurrentUser() user: PayloadDto) {
    return this.userService.deleteAccount(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async updateUser(
    @CurrentUser() user: PayloadDto,
    @Args('email') email?: string,
    @Args('name') name?: string,
  ) {
    return this.userService.updateUser(user.id, email, name);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() user: PayloadDto,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ) {
    return this.userService.changePassword(
      user.id,
      currentPassword,
      newPassword,
    );
  }
}
