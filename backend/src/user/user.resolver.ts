import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserType } from './user.graphql';
import { UserService } from './user.service';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { PayloadDto } from 'src/auth/dtos/payload.dto';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user: PayloadDto) {
    return this.userService.getCurrentUser(user.id);
  }

  // @Query(() => [UserType], { name: 'users' })
  // async getAllUsers() {
  //     return await this.userService.getAllUsers();
  // }

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
